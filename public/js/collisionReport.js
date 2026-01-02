/**
 * Collision Report JavaScript
 * Handles filtering, rendering, and exporting collision data
 */

(function() {
  'use strict';

  // ================================================================
  // Module State
  // ================================================================

  let REPORT = null; // Server-rendered report data

  // ================================================================
  // Utility Functions
  // ================================================================

  const byId = id => document.getElementById(id);
  
  const timeToMinutes = (t) => {
    if (!t) return 0;
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };
  
  const overlap = (aStart, aEnd, bStart, bEnd) => {
    return aStart < bEnd && bStart < aEnd;
  };

  // ================================================================
  // Initialization
  // ================================================================

  document.addEventListener('DOMContentLoaded', function() {
    // Load report data from server-rendered JSON
    loadReportData();

    // Build dynamic filter options
    buildVenueOptions(REPORT.rawSlots);

    // Initial render
    const initialFiltered = filterReport(REPORT, {
      day: '',
      venue: '',
      program_type: '',
      search: ''
    });
    renderReport(initialFiltered);

    // Attach event handlers
    attachFilterHandlers();
    attachExportHandlers();
  });

  // ================================================================
  // Data Loading
  // ================================================================

  /**
   * Load report data from server-rendered JSON
   */
  function loadReportData() {
    const reportElement = document.getElementById('reportData');
    if (reportElement) {
      try {
        REPORT = JSON.parse(reportElement.textContent);
      } catch (error) {
        console.error('Failed to parse report data:', error);
        REPORT = { 
          generatedAt: new Date().toISOString(),
          totals: { scanned: 0, programCollisions: 0, tutorCollisions: 0, venueCollisions: 0 },
          details: { programCollisions: [], tutorCollisions: [], venueCollisions: [] },
          rawSlots: []
        };
      }
    }
  }

  // ================================================================
  // Filter Options Builder
  // ================================================================

  /**
   * Build venue filter options from raw slots
   * @param {Array} slots - Raw slots data
   */
  function buildVenueOptions(slots) {
    const venueSet = new Set();
    slots.forEach(s => {
      if (s.venue_name) venueSet.add(s.venue_name);
    });

    const venues = Array.from(venueSet).sort();
    const select = byId('filterVenue');

    venues.forEach(venue => {
      const option = document.createElement('option');
      option.value = venue;
      option.textContent = venue;
      select.appendChild(option);
    });
  }

  // ================================================================
  // Event Handlers
  // ================================================================

  /**
   * Attach filter change handlers
   */
  function attachFilterHandlers() {
    const filterElements = [
      'filterDay',
      'filterVenue',
      'filterProgType',
      'globalSearch'
    ];

    filterElements.forEach(id => {
      const element = byId(id);
      const eventType = id === 'globalSearch' ? 'input' : 'change';
      
      element.addEventListener(eventType, function() {
        applyFilters();
      });
    });
  }

  /**
   * Attach export button handlers
   */
  function attachExportHandlers() {
    byId('exportCsvBtn').addEventListener('click', handleExportCSV);
    byId('exportPdfBtn').addEventListener('click', handleExportPDF);
    byId('printBtn').addEventListener('click', handlePrint);
  }

  /**
   * Apply current filter settings
   */
  function applyFilters() {
    const filters = {
      day: byId('filterDay').value,
      venue: byId('filterVenue').value,
      program_type: byId('filterProgType').value,
      search: byId('globalSearch').value.trim()
    };

    const filtered = filterReport(REPORT, filters);
    renderReport(filtered);
  }

  // ================================================================
  // Report Filtering
  // ================================================================

  /**
   * Filter report based on provided filters
   * @param {Object} report - Full report data
   * @param {Object} filters - Filter criteria
   * @returns {Object} - Filtered report
   */
  function filterReport(report, filters) {
    function filterList(list) {
      return list.filter(item => {
        // Day filter
        if (filters.day && item.day !== filters.day) return false;

        // Program type filter
        if (filters.program_type) {
          const anyMatch = item.slots.some(s => 
            (s.program_type || '').toLowerCase() === filters.program_type.toLowerCase()
          );
          if (!anyMatch) return false;
        }

        // Venue filter
        if (filters.venue) {
          const anyVenue = item.slots.some(s => 
            (s.venue || s.venue_name || '').toLowerCase() === filters.venue.toLowerCase()
          );
          if (!anyVenue) return false;
        }

        // Search filter
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const anyText = item.slots.some(s => 
            (s.label || '').toLowerCase().includes(q) ||
            (s.venue || s.venue_name || '').toLowerCase().includes(q)
          );
          if (!anyText) return false;
        }

        return true;
      });
    }

    const filteredReport = {
      generatedAt: report.generatedAt,
      totals: { ...report.totals },
      details: {
        programCollisions: filterList(report.details.programCollisions),
        tutorCollisions: filterList(report.details.tutorCollisions),
        venueCollisions: filterList(report.details.venueCollisions)
      },
      rawSlots: report.rawSlots
    };

    // Update totals to reflect filtered counts
    filteredReport.totals.programCollisions = filteredReport.details.programCollisions.length;
    filteredReport.totals.tutorCollisions = filteredReport.details.tutorCollisions.length;
    filteredReport.totals.venueCollisions = filteredReport.details.venueCollisions.length;

    return filteredReport;
  }

  // ================================================================
  // Report Rendering
  // ================================================================

  /**
   * Render full collision report
   * @param {Object} filteredReport - Filtered report data
   */
  function renderReport(filteredReport) {
    const container = byId('reportContainer');
    container.innerHTML = '';

    // Program collisions section
    renderCollisionSection(
      container,
      'Program Collisions',
      filteredReport.details.programCollisions,
      'program'
    );

    // Tutor collisions section
    renderCollisionSection(
      container,
      'Tutor Collisions',
      filteredReport.details.tutorCollisions,
      'tutor'
    );

    // Venue collisions section
    renderCollisionSection(
      container,
      'Venue Collisions',
      filteredReport.details.venueCollisions,
      'venue'
    );

    // Update summary counters
    updateSummary(filteredReport.totals);
  }

  /**
   * Render a collision section
   * @param {HTMLElement} container - Container element
   * @param {string} title - Section title
   * @param {Array} collisions - Collision items
   * @param {string} type - Collision type
   */
  function renderCollisionSection(container, title, collisions, type) {
    const section = document.createElement('section');
    
    const heading = document.createElement('h3');
    heading.textContent = `${title} (${collisions.length})`;
    section.appendChild(heading);

    if (collisions.length === 0) {
      const noData = document.createElement('p');
      noData.className = 'text-muted';
      noData.textContent = `No ${title.toLowerCase()} found.`;
      section.appendChild(noData);
    } else {
      collisions.forEach((collision, idx) => {
        const card = buildCollisionCard(type, idx, collision);
        section.appendChild(card);
      });
    }

    container.appendChild(section);
  }

  /**
   * Build collision card element
   * @param {string} type - Collision type (program, tutor, venue)
   * @param {number} idx - Collision index
   * @param {Object} item - Collision data
   * @returns {HTMLElement} - Collision card element
   */
  function buildCollisionCard(type, idx, item) {
    const card = document.createElement('div');
    card.className = `collision-card ${type}-collision card`;

    const body = document.createElement('div');
    body.className = 'collision-card-body card-body';

    // Title
    const title = document.createElement('h5');
    title.className = 'collision-card-title';
    title.textContent = getCollisionTitle(type, idx, item);
    body.appendChild(title);

    // Slots list
    const list = document.createElement('ul');
    list.className = 'collision-card-list';
    
    item.slots.forEach(slot => {
      const li = document.createElement('li');
      li.innerHTML = `
        <code>${slot.label || slot.id}</code> — 
        Venue: ${slot.venue || slot.venue_name || 'N/A'} — 
        ProgType: ${slot.program_type || 'N/A'}
      `;
      list.appendChild(li);
    });
    body.appendChild(list);

    // Analyze button and collapse
    const analysisId = `analysis-${type}-${idx}`;
    const analyzeBtn = createAnalyzeButton(analysisId);
    body.appendChild(analyzeBtn);

    const analysisSection = createAnalysisSection(analysisId, item);
    body.appendChild(analysisSection);

    // Metadata
    const meta = document.createElement('div');
    meta.className = 'collision-metadata';
    meta.innerHTML = `Collision IDs: ${item.ids.join(', ')}`;
    body.appendChild(meta);

    card.appendChild(body);
    return card;
  }

  /**
   * Get collision title text
   */
  function getCollisionTitle(type, idx, item) {
    let title = `${type.charAt(0).toUpperCase() + type.slice(1)} Collision #${idx + 1} — ${item.day}`;
    
    if (type === 'program') {
      title += ` — Programs: ${item.matchedPrograms.join(', ') || 'N/A'}`;
    } else if (type === 'tutor') {
      title += ` — Tutor: ${item.tutor}`;
    } else if (type === 'venue') {
      title += ` — Venue: ${item.venue_name}`;
    }
    
    return title;
  }

  /**
   * Create analyze button
   */
  function createAnalyzeButton(targetId) {
    const btn = document.createElement('button');
    btn.className = 'btn-analyze btn btn-sm';
    btn.textContent = 'Analyze';
    btn.setAttribute('data-bs-toggle', 'collapse');
    btn.setAttribute('data-bs-target', `#${targetId}`);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', targetId);
    return btn;
  }

  /**
   * Create analysis section
   */
  function createAnalysisSection(analysisId, item) {
    const wrapper = document.createElement('div');
    wrapper.className = 'analysis-collapse collapse';
    wrapper.id = analysisId;

    const analysisCard = document.createElement('div');
    analysisCard.className = 'analysis-card card card-body mt-3';
    
    analysisCard.innerHTML = `
      <strong>Detailed Analysis</strong>
      <ul>
        ${item.slots.map(s => `
          <li>
            <code>${s.label || s.id}</code> — 
            Created: ${s.created_at || 'N/A'}
          </li>
        `).join('')}
      </ul>
      <p><strong>Suggested Actions:</strong></p>
      <ol>
        <li>Keep the earliest extracted slot (lowest created_at or lowest ID).</li>
        <li>Consider moving the later slot to an available slot — search same venue on other days first.</li>
        <li>If tutor conflict: Contact tutor or reassign tutor for one slot.</li>
        <li>If program collision: Coordinate with program coordinators to avoid scheduling conflicts.</li>
      </ol>
    `;

    wrapper.appendChild(analysisCard);
    return wrapper;
  }

  /**
   * Update summary counters
   */
  function updateSummary(totals) {
    byId('summaryScanned').textContent = totals.scanned;
    byId('summaryProgram').textContent = totals.programCollisions;
    byId('summaryTutor').textContent = totals.tutorCollisions;
    byId('summaryVenue').textContent = totals.venueCollisions;
  }

  // ================================================================
  // Export Handlers
  // ================================================================

  /**
   * Handle CSV export
   */
  function handleExportCSV() {
    const filters = getCurrentFilters();
    const filtered = filterReport(REPORT, filters);
    exportCSV(filtered);
  }

  /**
   * Handle PDF export
   */
  function handleExportPDF() {
    const container = byId('reportContainer');
    exportPDF(container);
  }

  /**
   * Handle print
   */
  function handlePrint() {
    const container = byId('reportContainer');
    printReport(container);
  }

  /**
   * Get current filter settings
   */
  function getCurrentFilters() {
    return {
      day: byId('filterDay').value,
      venue: byId('filterVenue').value,
      program_type: byId('filterProgType').value,
      search: byId('globalSearch').value.trim()
    };
  }

  // ================================================================
  // Export Functions
  // ================================================================

  /**
   * Export report as CSV
   */
  function exportCSV(reportObj) {
    const rows = [];
    
    // Header
    rows.push([
      "collision_type",
      "collision_id",
      "day",
      "matched_info",
      "slot_id",
      "slot_label",
      "venue",
      "program_type"
    ].join(","));

    // Helper to add row
    const pushRow = (type, id, meta, slot) => {
      const row = [
        `"${type}"`,
        `"${id}"`,
        `"${meta}"`,
        `"${slot.id || ''}"`,
        `"${(slot.label || '').replace(/"/g, '""')}"`,
        `"${slot.venue || slot.venue_name || ''}"`,
        `"${slot.program_type || ''}"`
      ];
      rows.push(row.join(","));
    };

    // Add data rows
    reportObj.details.programCollisions.forEach((pc, i) => {
      pc.slots.forEach(slot => pushRow("program", i + 1, pc.matchedPrograms.join("|"), slot));
    });
    
    reportObj.details.tutorCollisions.forEach((tc, i) => {
      tc.slots.forEach(slot => pushRow("tutor", i + 1, tc.tutor, slot));
    });
    
    reportObj.details.venueCollisions.forEach((vc, i) => {
      vc.slots.forEach(slot => pushRow("venue", i + 1, vc.venue_name, slot));
    });

    // Download
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collision-report-${getTimestamp()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Export report as PDF
   */
  function exportPDF(domNode) {
    if (typeof html2pdf === 'undefined') {
      alert('PDF export library not loaded');
      return;
    }

    const opt = {
      margin: 0.4,
      filename: `collision-report-${getTimestamp()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(domNode).save();
  }

  /**
   * Print report
   */
  function printReport(container) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(n => n.outerHTML)
      .join('\n');
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Collision Report</title>
        ${styles}
      </head>
      <body>
        <h1>Collision Report</h1>
        ${container.outerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  /**
   * Get formatted timestamp
   */
  function getTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

})();
