# Timetable Generation and Collision Processing

This document explains how the Express/EJS timetable system creates timetable
entries, how manual assignment works, and how collision reports are produced.
It also identifies the exact route, logic, model, and database operation
responsible for each step.

The system has three separate timetable workflows:

1. **Automatic generation**: assigns pending subjects for one semester.
2. **Manual generation/assignment**: assigns selected subjects to a selected
   day, venue, and slot.
3. **Collision reporting**: scans existing timetable rows and reports venue,
   tutor, and program conflicts.

All three workflows use the database-backed semester calendar. No runtime
calendar map is hard-coded in the active Express models, routes, or logic
files.

---

## 1. Shared database concepts

### Main tables

| Table | Purpose |
|---|---|
| `subjects` | Subject requirements, tutor, semester, program, weekly hours, possible venues, and sequential-slot preference. |
| `venues` | Venue capacity, time-slot labels, and slot status columns such as `monday_slot1_status`. |
| `extracted_timetables` | Actual generated/manual timetable rows. |
| `semester_calendar_settings` | Active semester-to-month configuration used when deciding whether two semesters run at the same real time. |
| `users` | Tutor and account information. |

### Important `subjects` fields

- `semester`: subject semester, normalized to `I` or `II`.
- `total_hours_per_week`: required weekly teaching hours.
- `ltpa`: hours already assigned.
- `program_type`: for example `FULL-TIME`, `EVENING`, or `VETA`.
- `program_level`: used to resolve VETA calendar groups.
- `possible_venues_ids`: optional JSON list of allowed venue IDs.
- `sequential_slots`: requested contiguous-slot length/preference.
- `user_id`: tutor assigned to the subject.

### Important `extracted_timetables` fields

- `day`
- `start_time`
- `end_time`
- `venue_id`
- `venue_name`
- `subject_code`
- `subject_name`
- `semester`
- `program_code`
- `program_name`
- `program_type`
- `program_level`
- `tutor_name`
- `year`

If the deployed database contains `session_group_id`, generated multi-slot
rows can be grouped by that ID. The generation code checks the schema before
including that column, so an older database without it does not fail at insert
time.

---

## 2. Semester calendar resolution

### Source of truth

The only runtime source for semester months is:

- `semester_calendar_settings`
- [models/semesterCalendar.js](./models/semesterCalendar.js)
- [routes/semesterSettingsRoutes.js](./routes/semesterSettingsRoutes.js)
- [views/semester-settings.ejs](./views/semester-settings.ejs)

`loadSemesterCalendarSettings()` reads active settings from the database.
`createSemesterCalendarResolver()` then resolves the applicable months for an
entry using this priority:

1. subject-specific setting
2. program ID/code/name setting
3. department setting
4. program-type/group setting
5. global setting

The resolver maps VETA entries to `VETA_L1L2` or `VETA_L3` using
`program_type` and `program_level`. Non-VETA entries resolve to `NON_VETA`.

### Calendar overlap rule

Two timetable entries are considered to run in the same real period when their
resolved month lists intersect.

```text
months(entry A, semester A) ∩ months(entry B, semester B) != empty
```

If one or both entries have no matching database setting, the resolver returns
`true` conservatively. This prevents the system from silently allowing a
possible collision when calendar configuration is incomplete.

### Calendar configuration warning

Every required combination should have an active database setting. For
example, if `NON_VETA / II` exists but `NON_VETA / I` does not, a comparison
involving Semester I is treated as potentially overlapping until Semester I is
configured on `/semester-settings`.

---

## 3. Automatic timetable generation

### Entry point

```text
POST /tmaster/add
```

Implemented by:

| Layer | File | Responsibility |
|---|---|---|
| Route | [routes/tmaster.js](./routes/tmaster.js) | Registers `/tmaster/add`, semester API, and log-stream endpoint. |
| Logic | [logics/tmasterLogic.js](./logics/tmasterLogic.js) | Normalizes and validates the requested semester, then starts generation in the background. |
| Model | [models/tmasterModel.js](./models/tmasterModel.js) | Performs subject selection, slot search, collision checks, inserts, and progress updates. |
| Browser log stream | [routes/tmaster.js](./routes/tmaster.js) | Streams `models/timetable-logs.txt` using SSE. |
| Browser UI | `public/js/tmaster.js` and `views/tmaster.ejs` | Starts generation and displays progress/completion/errors. |

### Automatic process

#### Step 1: validate semester

`handleAddtimetable()` calls `normalizeSemesterToken()` and only accepts `I`
or `II`. Invalid or missing values return HTTP 400.

#### Step 2: load calendar settings

`models/tmasterModel.js:addtimetable()` calls:

```js
loadSemesterCalendarSettings()
createSemesterCalendarResolver(...)
```

The resulting resolver is reused for every existing-entry collision check in
that generation run.

#### Step 3: select pending subjects

Subjects are selected from `subjects` where:

```sql
COALESCE(ltpa, 0) < total_hours_per_week
AND semester = ?
```

The query prioritizes subjects with the greatest remaining hours. The model
then applies a most-constrained-subject ordering based on currently usable
slots and venues, so subjects with fewer legal choices are attempted first.

#### Step 4: determine legal time slots

The model separates available times by program type:

- full-time subjects use full-time slots;
- evening subjects use evening slots;
- combined full-time/evening programs use the permitted combined ranges;
- VETA subjects use the VETA-compatible range.

The day/slot definitions and the `programSlotMatch()` check are in
[models/tmasterModel.js](./models/tmasterModel.js).

#### Step 5: choose venues

Candidate venues are filtered using:

- venue capacity;
- venue slot status;
- subject `possible_venues_ids`, when configured;
- current venue availability;
- existing timetable occupancy.

Possible venues are prioritized before other legal venues. The current
generation models use explicit capacity constants of 20% tolerance and 30%
underutilization threshold. An underutilized assignment is logged instead of
being silently discarded. The `semester_calendar_settings` table also stores
threshold columns, but the current auto/manual assignment code does not yet
read those columns dynamically.

#### Step 6: support sequential slots

When a subject requests sequential slots, the generator looks for contiguous
available slots on the same day and venue. It does not treat disconnected
slots as a valid sequential block.

#### Step 7: check existing timetable collisions

Before inserting a candidate, the model checks existing rows for the same day
and overlapping time range. It then applies the database-backed semester
resolver.

Rows in different real calendar months are not treated as a semester
collision. Rows whose calendar settings are missing are treated
conservatively as overlapping.

The collision checks account for:

- tutor conflict;
- venue conflict;
- program conflict;
- same-session/co-teaching exceptions;
- maximum co-teacher limit.

`isSameSession()` prevents a legitimate co-taught class from being treated as a
normal collision when subject, cohort, year, and overlapping program code
identify the same session.

#### Step 8: insert timetable rows

The accepted candidate is inserted into `extracted_timetables`. For a
multi-slot assignment, one row is inserted per occupied slot. If
`session_group_id` exists in the deployed schema, it is included; otherwise
the model uses the compatible column list.

#### Step 9: update subject progress

After a successful insert:

- `subjects.ltpa` is increased;
- the assigned venue slot status is updated;
- the next generation pass sees the reduced remaining hours.

#### Step 10: stop safely

Generation ends when:

- no subjects remain below their required hours; or
- a complete pass assigns nothing; or
- the hard maximum generation-pass limit is reached.

The no-progress and pass-limit guards prevent an impossible subject from
creating an infinite loop.

### Automatic generation completion

Generation runs asynchronously. The POST response means **generation
started**, not that all rows are already inserted.

The browser follows:

```text
GET /tmaster/stream-logs?semester=I|II
```

The stream finishes only when the log contains the real completion marker:

```text
=== TIMETABLE GENERATION COMPLETED SUCCESSFULLY ===
```

Fatal errors are sent as error events instead of being presented as a
successful generation.

---

## 4. Manual timetable generation

### Entry point

```text
POST /manualTimetable/add
```

Implemented by:

| Layer | File | Responsibility |
|---|---|---|
| Route | [routes/manualTimetableRoutes.js](./routes/manualTimetableRoutes.js) | Loads the manual page and accepts the assignment form. |
| Logic | [logics/manualTimetableLogic.js](./logics/manualTimetableLogic.js) | Validates form data, calls the model, and re-renders the filtered page. |
| Model | [models/manualTimetableModel.js](./models/manualTimetableModel.js) | Validates venue/slot/subject constraints, checks collisions, inserts rows, and updates state. |
| View | `views/manualTimetable.ejs` | Displays available venues, slots, subjects, filters, and assignment results. |

### Manual process

1. The user selects a day, venue, slot, and one or more subjects.
2. The route logic normalizes `subject_ids[]` into an array.
3. The model loads each subject and its tutor data from the database.
4. The model validates that the selected venue is allowed by
   `possible_venues_ids`, when that field is configured.
5. The selected slot is resolved to the exact venue status column, such as
   `monday_slot4_status`.
6. The selected time is checked against the subject's program slot range.
7. Sequential-slot requests are expanded into contiguous slots.
8. Existing timetable rows on the same day/time are loaded.
9. The database-backed semester resolver is applied before collision decisions.
10. Tutor, venue, program, and co-teaching rules are applied.
11. Accepted rows are inserted into `extracted_timetables`.
12. Venue status columns are marked used and `subjects.ltpa` is updated.
13. The page is rendered again with the original filters and operation logs.

### Manual assignment errors

The manual workflow rejects or logs problems such as:

- missing day, venue, slot, or subject;
- unknown venue;
- invalid slot number/time;
- venue not listed in the subject's possible venues;
- program type not allowed in the selected time;
- insufficient contiguous slots;
- tutor collision;
- venue collision;
- program collision;
- weekly hours already satisfied.

---

## 5. Collision report

### Entry point

```text
GET /collision-report
GET /collision-report?semester=I
GET /collision-report?semester=II
```

Implemented by:

| Layer | File | Responsibility |
|---|---|---|
| Route | [routes/collisionReportRoutes.js](./routes/collisionReportRoutes.js) | Registers the report endpoint. |
| Logic/controller | [logics/collisionReportLogic.js](./logics/collisionReportLogic.js) | Loads rows, compares pairs, classifies collisions, and renders the report. |
| Model | [models/collisionReportModel.js](./models/collisionReportModel.js) | Fetches timetable rows from `extracted_timetables`. |
| Calendar service | [models/semesterCalendar.js](./models/semesterCalendar.js) | Resolves real calendar-month overlap. |

### Collision-report process

#### Step 1: load timetable rows

`fetchAllSlots()` reads timetable rows and optionally filters by the requested
semester.

#### Step 2: normalize values

The controller calculates:

- start time in minutes;
- end time in minutes;
- normalized venue name;
- normalized tutor name;
- normalized program name;
- split program codes from values such as `DIT+BIT`.

#### Step 3: compare row pairs

Each pair is compared only when:

1. both rows are on the same day; and
2. their time ranges overlap.

The time rule is:

```text
startA < endB AND startB < endA
```

#### Step 4: apply semester calendar

Before a pair becomes a reported collision, the controller resolves the
semester months from `semester_calendar_settings`.

If the month lists do not intersect, the pair is skipped because the entries
belong to different real calendar periods. If settings are missing, the pair
is retained conservatively.

#### Step 5: classify collision type

The report independently checks:

- **Venue collision**: same normalized venue;
- **Tutor collision**: same normalized tutor;
- **Program collision**: matching program code, or matching program name when
  program codes are unavailable.

Each pair is deduplicated using a collision key containing the collision type
and sorted timetable IDs.

Rows that represent the same subject, semester, level, year, and overlapping
program code are treated as one co-taught session when they have different
tutors/venues. They are not reported as a program collision. This matches the
`isSameSession()` rule used by automatic and manual assignment. Venue and tutor
checks remain independent, so a genuine same-venue or same-tutor conflict is
still reported.

### Difference between generation checks and report checks

Generation checks happen before a new row is inserted and prevent invalid
assignments.

The collision report checks rows that already exist and explains conflicts to
the user. Therefore, the report can identify old conflicts created before a
calendar setting was changed, while generation uses the current settings to
prevent new conflicts.

---

## 6. Semester Calendar Settings page

### Entry points

```text
GET  /semester-settings
GET  /semester-settings/api
POST /semester-settings/api
POST /semester-settings/api/delete
```

Only `admin` and `tmaster` may create, update, or deactivate settings.

The page validates:

- semester must normalize to `I` or `II`;
- at least one month is required;
- month values must be valid calendar months;
- duplicate months are removed.

Semester I and Semester II are separate records and can both be active at the
same time. Their months may overlap intentionally, in which case the resolver
correctly treats them as potentially colliding.

---

## 7. How to trace a problem

### Auto generation inserts nothing

Check, in order:

1. `models/timetable-logs.txt`
2. `subjects.ltpa` versus `subjects.total_hours_per_week`
3. subject semester values (`I`/`II`)
4. venue slot statuses
5. venue capacity and `possible_venues_ids`
6. program slot range
7. semester calendar settings
8. `extracted_timetables` schema, especially `session_group_id`

Useful queries:

```sql
SELECT semester, COUNT(*)
FROM subjects
GROUP BY semester;

SELECT subject_id, subject_code, semester, ltpa, total_hours_per_week
FROM subjects
WHERE semester = 'II';

SELECT semester, COUNT(*)
FROM extracted_timetables
GROUP BY semester;
```

### Collision report shows too many collisions

Check:

1. the two rows' day and time;
2. their semester values;
3. active rows in `semester_calendar_settings`;
4. `program_type` and `program_level`;
5. whether a missing calendar setting is causing the conservative overlap
   result.

### Collision report misses an expected collision

Check:

1. whether the time ranges actually overlap;
2. whether the venue/tutor names differ only by formatting;
3. whether program codes are populated;
4. whether the semester months are configured correctly;
5. whether the two semesters intentionally have disjoint calendar months.

---

## 8. Summary of source files

| Feature | Main implementation |
|---|---|
| Automatic generation | [models/tmasterModel.js](./models/tmasterModel.js) |
| Automatic generation request | [logics/tmasterLogic.js](./logics/tmasterLogic.js) |
| Automatic generation route and SSE | [routes/tmaster.js](./routes/tmaster.js) |
| Manual assignment | [models/manualTimetableModel.js](./models/manualTimetableModel.js) |
| Manual assignment request | [logics/manualTimetableLogic.js](./logics/manualTimetableLogic.js) |
| Manual assignment route | [routes/manualTimetableRoutes.js](./routes/manualTimetableRoutes.js) |
| Collision report | [logics/collisionReportLogic.js](./logics/collisionReportLogic.js) |
| Collision report data query | [models/collisionReportModel.js](./models/collisionReportModel.js) |
| Collision report route | [routes/collisionReportRoutes.js](./routes/collisionReportRoutes.js) |
| Calendar resolver | [models/semesterCalendar.js](./models/semesterCalendar.js) |
| Calendar settings CRUD | [routes/semesterSettingsRoutes.js](./routes/semesterSettingsRoutes.js) |
| Subject scheduling fields | [models/subjectsModel.js](./models/subjectsModel.js) |
