import { getAllSlots, getSlotsByVenueAndDay, relocateSlot, getVenuesByTypeAndCapacity } from "../models/collisionMonitorModel.js";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"];

export const SLOT_DEFS = [
  { no: 1, start:"07:30:00", end:"08:15:00" }, { no: 2, start:"08:15:00", end:"09:00:00" },
  { no: 3, start:"09:05:00", end:"09:50:00" }, { no: 4, start:"09:50:00", end:"10:35:00" },
  { no: 5, start:"11:00:00", end:"11:45:00" }, { no: 6, start:"11:45:00", end:"12:30:00" },
  { no: 7, start:"13:15:00", end:"14:00:00" }, { no: 8, start:"14:00:00", end:"14:45:00" },
  { no: 9, start:"14:50:00", end:"15:35:00" }, { no: 10, start:"15:35:00", end:"16:20:00" },
  { no: 11, start:"16:25:00", end:"17:10:00" }, { no: 12, start:"17:10:00", end:"17:55:00" },
  { no: 13, start:"18:00:00", end:"18:45:00" }, { no: 14, start:"18:45:00", end:"19:35:00" },
  { no: 15, start:"19:40:00", end:"20:25:00" }, { no: 16, start:"20:25:00", end:"21:05:00" },
  { no: 17, start:"21:10:00", end:"21:55:00" }, { no: 18, start:"22:00:00", end:"22:45:00" },
];

// break times in minutes
const TEA_BREAK_START = 10*60+35;
const TEA_BREAK_END = 11*60;
const LUNCH_BREAK_START = 12*60+30;
const LUNCH_BREAK_END = 13*60+15;
const FRIDAY_BLOCK_START = 11*60+45;
const FRIDAY_BLOCK_END = 14*60;

const timeToMinutes = t => { const [hh,mm] = t.split(":").map(Number); return hh*60+mm; };
const overlap = (s1,e1,s2,e2) => s1<e2 && s2<e1;

const isForbiddenByBreaks = (day,start,end)=>{
  const s=timeToMinutes(start), e=timeToMinutes(end);
  if(overlap(s,e,TEA_BREAK_START,TEA_BREAK_END)) return true;
  if(overlap(s,e,LUNCH_BREAK_START,LUNCH_BREAK_END)) return true;
  if(day==="FRIDAY" && overlap(s,e,FRIDAY_BLOCK_START,FRIDAY_BLOCK_END)) return true;
  return false;
};

const parseProgramCodes = str => str ? str.split("+").map(x=>x.trim()) : [];

const candidateFits = (existingSlots,candidateIndex,consecutive, program_type)=>{
  if(candidateIndex<0 || candidateIndex+consecutive-1>=SLOT_DEFS.length) return false;
  for(let k=0;k<consecutive;k++){
    const def=SLOT_DEFS[candidateIndex+k];
    if(isForbiddenByBreaks(null,def.start,def.end)) return false;
    const no=def.no;
    // full-time and veta end at slot 12, evening starts at 13
    if(program_type==="full_time" && no>=13) return false;
    if(program_type==="veta" && no>=13) return false;
    if(program_type==="evening" && no<=12) return false;
    const candS=timeToMinutes(def.start), candE=timeToMinutes(def.end);
    for(const ex of existingSlots){
      const exS=timeToMinutes(ex.start_time), exE=timeToMinutes(ex.end_time);
      if(overlap(candS,candE,exS,exE)) return false;
    }
  }
  return true;
};

export const findSafeSlotInVenue = async (venue_id, allSlots, consecutive=1, fromDayIndex=0, program_type="full_time")=>{
  for(let di=fromDayIndex;di<DAYS.length;di++){
    const day=DAYS[di];
    const existing=allSlots.filter(s=>s.venue_id===venue_id && s.day===day);
    for(let idx=0;idx<SLOT_DEFS.length;idx++){
      if(!candidateFits(existing,idx,consecutive,program_type)) continue;
      const first=SLOT_DEFS[idx], last=SLOT_DEFS[idx+consecutive-1];
      return { venue_id, day, start_time:first.start, end_time:last.end, dayIndex:di, slotNos:SLOT_DEFS.slice(idx,idx+consecutive).map(d=>d.no) };
    }
  }
  return null;
};

const isSequentialPair = (a,b)=>a.end_time===b.start_time && a.subject_code===b.subject_code && a.program_code===b.program_code;

const hasCollision = (allSlots, slot)=>{
  const slotPrograms=parseProgramCodes(slot.program_code);
  for(const s of allSlots){
    if(s.id===slot.id) continue;
    if(s.program_type!==slot.program_type) continue;
    const overlapTime=overlap(timeToMinutes(slot.start_time),timeToMinutes(slot.end_time),
                              timeToMinutes(s.start_time),timeToMinutes(s.end_time));
    if(!overlapTime) continue;
    if(slot.tutor_name && s.tutor_name && slot.tutor_name===s.tutor_name && slot.subject_code!==s.subject_code) return true;
    const sPrograms=parseProgramCodes(s.program_code);
    if(slot.subject_code!==s.subject_code && slotPrograms.some(p=>sPrograms.includes(p))) return true;
  }
  return false;
};

export const runCollisionMonitor = async (options={})=>{
  const movedBy=options.user||"collision_monitor";
  const slots=await getAllSlots();
  const results={
    scanned: slots.length,
    collisionsFound:0,
    relocated:[],
    failedToRelocate:[],
    skipped:[],
    exchanges:[],
    collisionDetails:[]
  };

  // detect collisions
  const collisions = [];
  for(let i=0;i<slots.length;i++){
    const a=slots[i];
    for(let j=i+1;j<slots.length;j++){
      const b=slots[j];
      if(!overlap(timeToMinutes(a.start_time),timeToMinutes(a.end_time),
                  timeToMinutes(b.start_time),timeToMinutes(b.end_time))) continue;
      if(a.program_type!==b.program_type) continue;
      if(a.tutor_name===b.tutor_name || parseProgramCodes(a.program_code).some(p=>parseProgramCodes(b.program_code).includes(p))){
        collisions.push([a,b]);
        results.collisionsFound++;
        results.collisionDetails.push({
          slot1_id:a.id, slot2_id:b.id,
          tutor1:a.tutor_name, tutor2:b.tutor_name,
          subject1:a.subject_code, subject2:b.subject_code,
          program1:a.program_code, program2:b.program_code,
          venue1:a.venue_name, venue2:b.venue_name,
          day:a.day
        });
      }
    }
  }

  const allSlotsMap = [...slots];
  const deferredSlots = [];

  // resolve collisions
  for(const [a,b] of collisions){
    let toMove=(new Date(a.created_at||0)>new Date(b.created_at||0))?a:b;
    let consecutive=1, neighbor=null;
    const idxToMove = allSlotsMap.findIndex(s=>s.id===toMove.id);
    if(idxToMove!==-1){
      const fwd=allSlotsMap[idxToMove+1], back=allSlotsMap[idxToMove-1];
      if(fwd && isSequentialPair(toMove,fwd)){ consecutive=2; neighbor=fwd; }
      else if(back && isSequentialPair(back,toMove)){ consecutive=2; neighbor=back; }
    }

    let safe = await findSafeSlotInVenue(toMove.venue_id, allSlotsMap, consecutive, DAYS.indexOf(toMove.day)+1, toMove.program_type);

    if(!safe){
      const otherVenues = await getVenuesByTypeAndCapacity(toMove.venue_type, toMove.venue_capacity);
      for(const v of otherVenues){
        if(v.id===toMove.venue_id) continue;
        safe = await findSafeSlotInVenue(v.id, allSlotsMap, consecutive, 0, toMove.program_type);
        if(safe){ safe.venue_id=v.id; safe.venue_name=v.name; break; }
      }
    }

    if(!safe){
      deferredSlots.push(toMove.id);
      results.skipped.push({ slotId:toMove.id, reason:"Collision detected, deferred for later" });
      continue;
    }

    const testSlot = { ...toMove, ...safe };
    if(hasCollision(allSlotsMap, testSlot)){
      deferredSlots.push(toMove.id);
      results.skipped.push({ slotId:toMove.id, reason:"Proposed relocation still causes collision, deferred" });
      continue;
    }

    try{
      await relocateSlot(toMove.id, safe.day, safe.start_time, safe.end_time, movedBy);
      if(consecutive===2 && neighbor){
        const secondDef = SLOT_DEFS.find(d=>d.no===safe.slotNos[1]);
        await relocateSlot(neighbor.id, safe.day, secondDef.start, secondDef.end, movedBy);
      }
      results.relocated.push({ movedSlotId:toMove.id, old:{day:toMove.day,start_time:toMove.start_time,end_time:toMove.end_time}, new:{day:safe.day,start_time:safe.start_time,end_time:safe.end_time}, consecutive });
    }catch(err){
      results.failedToRelocate.push({ slotId:toMove.id, reason:"Relocation failed", error:err.message||String(err) });
    }
  }

  // retry deferred slots with full-time, evening, and veta consideration
  for(const slotId of deferredSlots){
    const slot = allSlotsMap.find(s=>s.id===slotId);
    if(!slot) continue;

    let safe = await findSafeSlotInVenue(slot.venue_id, allSlotsMap, 1, DAYS.indexOf(slot.day)+1, slot.program_type);
    if(!safe){
      const otherVenues = await getVenuesByTypeAndCapacity(slot.venue_type, slot.venue_capacity);
      for(const v of otherVenues){
        if(v.id===slot.venue_id) continue;
        safe = await findSafeSlotInVenue(v.id, allSlotsMap, 1, 0, slot.program_type);
        if(safe){ safe.venue_id=v.id; safe.venue_name=v.name; break; }
      }
    }

    if(!safe || hasCollision(allSlotsMap, {...slot, ...safe})){
      results.skipped.push({ slotId:slot.id, reason:"Still impossible, leave for manual assign later" });
      continue;
    }

    try{
      await relocateSlot(slot.id, safe.day, safe.start_time, safe.end_time, movedBy);
      results.relocated.push({ movedSlotId:slot.id, old:{day:slot.day,start_time:slot.start_time,end_time:slot.end_time}, new:{day:safe.day,start_time:safe.start_time,end_time:safe.end_time}, consecutive:1 });
    }catch(err){
      results.failedToRelocate.push({ slotId:slot.id, reason:"Relocation failed", error:err.message||String(err) });
    }
  }

  return results;
};
