/**
 * ===================================================================
 * COLLISION MONITOR JAVASCRIPT
 * Real-time collision detection and resolution monitoring
 * ===================================================================
 */

(function() {
  'use strict';

  /**
   * ===================================================================
   * 1. INITIALIZATION
   * ===================================================================
   */

  document.addEventListener('DOMContentLoaded', function() {
    initializeCollisionMonitor();
  });

  /**
   * Initialize collision monitor functionality
   */
  function initializeCollisionMonitor() {
    const runBtn = document.getElementById('runBtn');
    if (runBtn) {
      runBtn.addEventListener('click', handleRunMonitor);
    }
  }

  /**
   * ===================================================================
   * 2. MAIN MONITOR EXECUTION
   * ===================================================================
   */

  /**
   * Handle run monitor button click
   */
  async function handleRunMonitor() {
    const btn = document.getElementById('runBtn');
    const statusDiv = document.getElementById('status');
    
    // Disable button and show loading state
    btn.disabled = true;
    btn.classList.add('running');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> Running...';
    
    updateStatus('Working...', 'working');

    try {
      // Make API call to run collision monitor
      const response = await fetch('/collision-monitor/run', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ user: 'admin' })
      });

      const data = await response.json();

      if (!data.ok) {
        const errorMessage = data.error || 'Unknown error occurred';
        updateStatus(`Error: ${errorMessage}`, 'error');
        return;
      }

      // Process and display results
      displayResults(data.result);
      displaySummaryStatus(data.result);

    } catch (error) {
      console.error('Collision monitor error:', error);
      updateStatus(`Unexpected error: ${error.message}`, 'error');
    } finally {
      // Re-enable button
      btn.disabled = false;
      btn.classList.remove('running');
      btn.innerHTML = originalText;
    }
  }

  /**
   * ===================================================================
   * 3. STATUS DISPLAY
   * ===================================================================
   */

  /**
   * Update status display
   * @param {string} message - Status message
   * @param {string} type - Status type (working, success, error)
   */
  function updateStatus(message, type = 'working') {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status-display status-${type}`;
  }

  /**
   * Display summary status after monitor run
   * @param {Object} result - Monitor results
   */
  function displaySummaryStatus(result) {
    const summary = [
      `Scanned: ${result.scanned || 0}`,
      `Collisions: ${result.collisionsFound || 0}`,
      `Relocated: ${result.relocated?.length || 0}`,
      `Skipped: ${result.skipped?.length || 0}`,
      `Failed: ${result.failedToRelocate?.length || 0}`
    ].join(' | ');

    updateStatus(summary, 'success');
  }

  /**
   * ===================================================================
   * 4. RESULTS RENDERING
   * ===================================================================
   */

  /**
   * Display all monitor results
   * @param {Object} result - Monitor results object
   */
  function displayResults(result) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Render each result type
    renderResultTable(resultsContainer, 'Relocated Slots', result.relocated, 'success', 'relocated');
    renderResultTable(resultsContainer, 'Skipped Slots (No Safe Slot)', result.skipped, 'warning', 'skipped');
    renderResultTable(resultsContainer, 'Failed Moves', result.failedToRelocate, 'danger', 'failed');

    // Populate exchanged/swapped slots table
    populateExchangedSlots(result);

    // Populate collision details table
    populateCollisionDetails(result);
  }

  /**
   * Render a result table
   * @param {HTMLElement} container - Container element
   * @param {string} title - Table title
   * @param {Array} items - Data items
   * @param {string} variant - Bootstrap table variant
   * @param {string} sectionClass - CSS class for section
   */
  function renderResultTable(container, title, items, variant, sectionClass) {
    if (!items || items.length === 0) return;

    // Create section wrapper
    const section = document.createElement('div');
    section.className = `results-section ${sectionClass}`;

    // Create heading
    const heading = document.createElement('h5');
    heading.innerHTML = getIconForSection(sectionClass) + title;
    section.appendChild(heading);

    // Create table wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    // Create table
    const table = document.createElement('table');
    table.className = `table table-striped table-bordered table-hover table-${variant} collision-monitor-table`;

    // Create table header
    const thead = createTableHeader();
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    items.forEach(item => {
      const row = createResultRow(item);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    section.appendChild(wrapper);
    container.appendChild(section);
  }

  /**
   * Get icon for section type
   * @param {string} sectionClass - Section class name
   * @returns {string} Icon HTML
   */
  function getIconForSection(sectionClass) {
    const icons = {
      'relocated': '<i class="fas fa-check-circle"></i> ',
      'skipped': '<i class="fas fa-exclamation-triangle"></i> ',
      'failed': '<i class="fas fa-times-circle"></i> '
    };
    return icons[sectionClass] || '';
  }

  /**
   * Create table header
   * @returns {HTMLElement} Table header element
   */
  function createTableHeader() {
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Slot ID</th>
        <th>Program Type</th>
        <th>Tutor</th>
        <th>Program(s)</th>
        <th>Subject</th>
        <th>Venue</th>
        <th>Day</th>
        <th>Start Time</th>
        <th>End Time</th>
        <th>Slot Nos</th>
        <th>Reason</th>
      </tr>
    `;
    return thead;
  }

  /**
   * Create table row for result item
   * @param {Object} item - Result item
   * @returns {HTMLElement} Table row element
   */
  function createResultRow(item) {
    const oldSlot = item.old || item;
    const newSlot = item.new || {};
    
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><span class="slot-id-badge">${item.movedSlotId || item.slotId || '-'}</span></td>
      <td>${item.program_type || oldSlot.program_type || '-'}</td>
      <td>${oldSlot.tutor_name || '-'}</td>
      <td>${oldSlot.program_code || '-'}</td>
      <td>${oldSlot.subject_code || '-'}</td>
      <td>${oldSlot.venue_name || '-'}</td>
      <td>${oldSlot.day || '-'}</td>
      <td>${formatTimeChange(oldSlot.start_time, newSlot.start_time)}</td>
      <td>${formatTimeChange(oldSlot.end_time, newSlot.end_time)}</td>
      <td>${item.slotNos ? item.slotNos.join(', ') : '-'}</td>
      <td class="reason-cell">${item.reason || item.note || '-'}</td>
    `;
    
    return row;
  }

  /**
   * Format time change display
   * @param {string} oldTime - Original time
   * @param {string} newTime - New time
   * @returns {string} Formatted time display
   */
  function formatTimeChange(oldTime, newTime) {
    if (!oldTime) return '-';
    if (!newTime) return oldTime;
    return `${oldTime} <span class="text-arrow">→</span> <span class="highlight-change">${newTime}</span>`;
  }

  /**
   * ===================================================================
   * 5. EXCHANGED SLOTS TABLE
   * ===================================================================
   */

  /**
   * Populate exchanged/swapped slots table
   * @param {Object} result - Monitor results
   */
  function populateExchangedSlots(result) {
    const tbody = document.getElementById('exchangeBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!result.exchanges || result.exchanges.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data">No exchanged or swapped slots</td></tr>';
      return;
    }

    // Combine all slots for lookup
    const allSlots = [
      ...(result.relocated || []),
      ...(result.skipped || []),
      ...(result.failedToRelocate || [])
    ];

    result.exchanges.forEach(exchange => {
      const slot = allSlots.find(s => s.movedSlotId === exchange.movedSlotId) || {};
      const row = createExchangedSlotRow(exchange, slot);
      tbody.appendChild(row);
    });
  }

  /**
   * Create row for exchanged slot
   * @param {Object} exchange - Exchange data
   * @param {Object} slot - Slot data
   * @returns {HTMLElement} Table row
   */
  function createExchangedSlotRow(exchange, slot) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><span class="slot-id-badge">${exchange.movedSlotId || '-'}</span></td>
      <td>${slot.tutor_name || '-'}</td>
      <td>${slot.program_code || '-'}</td>
      <td>${slot.subject_code || '-'}</td>
      <td>${exchange.old?.venue || '-'}</td>
      <td>${exchange.old?.day || '-'}</td>
      <td>${exchange.old?.start || '-'} - ${exchange.old?.end || '-'}</td>
      <td>${exchange.new?.day || '-'}</td>
      <td>${exchange.new?.start || '-'} - ${exchange.new?.end || '-'}</td>
      <td>${formatConsecutive(exchange.consecutive)}</td>
    `;
    
    return row;
  }

  /**
   * Format consecutive indicator
   * @param {boolean} consecutive - Whether consecutive
   * @returns {string} Formatted HTML
   */
  function formatConsecutive(consecutive) {
    const isConsecutive = consecutive === true || consecutive === 'true';
    const cssClass = isConsecutive ? 'true' : 'false';
    const icon = isConsecutive ? '✓' : '✗';
    const text = isConsecutive ? 'Yes' : 'No';
    return `<span class="consecutive-indicator ${cssClass}">${icon} ${text}</span>`;
  }

  /**
   * ===================================================================
   * 6. COLLISION DETAILS TABLE
   * ===================================================================
   */

  /**
   * Populate collision details table
   * @param {Object} result - Monitor results
   */
  function populateCollisionDetails(result) {
    const tbody = document.getElementById('collisionBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!result.collisionDetails || result.collisionDetails.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data">No collision details available</td></tr>';
      return;
    }

    result.collisionDetails.forEach(collision => {
      const row = createCollisionDetailRow(collision);
      tbody.appendChild(row);
    });
  }

  /**
   * Create row for collision detail
   * @param {Object} collision - Collision data
   * @returns {HTMLElement} Table row
   */
  function createCollisionDetailRow(collision) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td><span class="slot-id-badge">${collision.slot1_id || '-'}</span></td>
      <td>${collision.tutor1 || '-'}</td>
      <td>${collision.program1 || '-'}</td>
      <td>${collision.subject1 || '-'}</td>
      <td><span class="slot-id-badge">${collision.slot2_id || '-'}</span></td>
      <td>${collision.tutor2 || '-'}</td>
      <td>${collision.program2 || '-'}</td>
      <td>${collision.subject2 || '-'}</td>
      <td>${collision.venue || '-'}</td>
      <td>${collision.day || '-'}</td>
    `;
    
    return row;
  }

  /**
   * ===================================================================
   * 7. UTILITY FUNCTIONS
   * ===================================================================
   */

  /**
   * Show notification (if notification system exists)
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  function showNotification(message, type = 'info') {
    // Check if global notification system exists
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

})();
