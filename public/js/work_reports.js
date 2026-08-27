/**
 * ===================================================================
 * WORK REPORTS JAVASCRIPT
 * Tutor workload reports with filtering and export functionality
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
    initializeWorkReports();
  });

  /**
   * Initialize work reports functionality
   */
  function initializeWorkReports() {
    // Only run on the work reports page
    if (!document.getElementById('user')) {
      return;
    }

    initializeSelect2();
    initializeExportButtons();
    highlightActiveFilters();
  }

  /**
   * ===================================================================
   * 2. SELECT2 INITIALIZATION
   * ===================================================================
   */

  /**
   * Initialize Select2 on all filter dropdowns
   */
  function initializeSelect2() {
    if (typeof $.fn.select2 !== 'function') {
      console.warn('Select2 not loaded');
      return;
    }

    $('select.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: function() {
        return $(this).data('placeholder') || 'Select an option';
      },
      allowClear: true
    });
  }

  /**
   * ===================================================================
   * 3. FILTER MANAGEMENT
   * ===================================================================
   */

  /**
   * Highlight active filters
   */
  function highlightActiveFilters() {
    $('.select2').each(function() {
      const $select = $(this);
      if ($select.val() && $select.val() !== '') {
        $select.closest('.mb-3').find('.form-label').addClass('text-primary-custom');
      }
    });
  }

  /**
   * Get active filters from form
   * @returns {Object} Active filters
   */
  function getActiveFilters() {
    const filters = {};
    
    $('.select2').each(function() {
      const $select = $(this);
      const name = $select.attr('name');
      const value = $select.val();
      
      if (value && value !== '') {
        filters[name] = value;
      }
    });

    return filters;
  }

  /**
   * ===================================================================
   * 4. EXPORT FUNCTIONALITY
   * ===================================================================
   */

  /**
   * Initialize export button handlers
   */
  function initializeExportButtons() {
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportPDFBtn = document.getElementById('exportPDF');
    const exportPrintBtn = document.getElementById('exportPrint');

    if (exportCSVBtn) {
      exportCSVBtn.addEventListener('click', exportToCSV);
    }

    if (exportPDFBtn) {
      exportPDFBtn.addEventListener('click', exportToPDF);
    }

    if (exportPrintBtn) {
      exportPrintBtn.addEventListener('click', handlePrint);
    }
  }

  /**
   * Export report to CSV
   */
  function exportToCSV() {
    const table = document.querySelector('.work-reports-table');
    if (!table) {
      showNotification('No report data to export', 'warning');
      return;
    }

    try {
      const rows = table.querySelectorAll('tbody tr');
      if (rows.length === 0) {
        showNotification('No data available to export', 'warning');
        return;
      }

      let csv = 'Tutor Name,Email,Department,Role,Status,Total Hours/Week,Subject Name,Subject Code,Program Name,Program Code,Program Department,Program Type,Level,Capacity,Duration\n';

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const tutorData = extractTutorData(cells[0]);
          const workloadData = extractWorkloadData(cells[1]);
          const programData = extractProgramData(cells[2]);

          csv += `"${escapeCSV(tutorData.name)}",`;
          csv += `"${escapeCSV(tutorData.email)}",`;
          csv += `"${escapeCSV(tutorData.department)}",`;
          csv += `"${escapeCSV(tutorData.role)}",`;
          csv += `"${escapeCSV(tutorData.status)}",`;
          csv += `"${escapeCSV(workloadData.totalHours)}",`;
          csv += `"${escapeCSV(workloadData.subjectName)}",`;
          csv += `"${escapeCSV(workloadData.subjectCode)}",`;
          csv += `"${escapeCSV(programData.name)}",`;
          csv += `"${escapeCSV(programData.code)}",`;
          csv += `"${escapeCSV(programData.department)}",`;
          csv += `"${escapeCSV(programData.type)}",`;
          csv += `"${escapeCSV(programData.level)}",`;
          csv += `"${escapeCSV(programData.capacity)}",`;
          csv += `"${escapeCSV(programData.duration)}"\n`;
        }
      });

      downloadCSV(csv, 'work_report_' + getTimestamp() + '.csv');
      showNotification('Report exported to CSV successfully', 'success');

    } catch (error) {
      console.error('CSV export error:', error);
      showNotification('Failed to export CSV', 'error');
    }
  }

  /**
   * Extract tutor data from cell
   * @param {HTMLElement} cell - Table cell
   * @returns {Object} Tutor data
   */
  function extractTutorData(cell) {
    const text = cell.textContent;
    return {
      name: extractValue(text, 'Name'),
      email: extractValue(text, 'Email'),
      department: extractValue(text, 'Mother department'),
      role: extractValue(text, 'Original role'),
      status: extractValue(text, 'Status')
    };
  }

  /**
   * Extract workload data from cell
   * @param {HTMLElement} cell - Table cell
   * @returns {Object} Workload data
   */
  function extractWorkloadData(cell) {
    const text = cell.textContent;
    return {
      subjectName: extractValue(text, 'sname'),
      subjectCode: extractValue(text, 'scode'),
      totalHours: extractValue(text, 'TOTAL HOURS PER WEEK:')
    };
  }

  /**
   * Extract program data from cell
   * @param {HTMLElement} cell - Table cell
   * @returns {Object} Program data
   */
  function extractProgramData(cell) {
    const text = cell.textContent;
    return {
      name: extractValue(text, 'program name'),
      code: extractValue(text, 'program code'),
      department: extractValue(text, 'mother program department'),
      type: extractValue(text, 'program type'),
      level: extractValue(text, 'program level'),
      capacity: extractValue(text, 'program capacity'),
      duration: extractValue(text, 'program Duration')
    };
  }

  /**
   * Extract value after label
   * @param {string} text - Text to search
   * @param {string} label - Label to find
   * @returns {string} Extracted value
   */
  function extractValue(text, label) {
    const regex = new RegExp(label + '\\s*([^\\n]+)', 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Escape CSV special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeCSV(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
  }

  /**
   * Download CSV file
   * @param {string} csv - CSV content
   * @param {string} filename - File name
   */
  function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export report to PDF
   */
  function exportToPDF() {
    const reportContent = document.querySelector('.work-reports-container');
    if (!reportContent) {
      showNotification('No report content to export', 'warning');
      return;
    }

    // Check if html2pdf is available
    if (typeof html2pdf === 'undefined') {
      showNotification('PDF export library not loaded', 'error');
      return;
    }

    try {
      // Clone content and prepare for PDF
      const clonedContent = reportContent.cloneNode(true);
      
      // Remove filter section and export buttons from clone
      const filterSection = clonedContent.querySelector('.filter-section');
      const exportButtons = clonedContent.querySelector('.export-buttons');
      const header = clonedContent.querySelector('.work-reports-header');
      
      if (filterSection) filterSection.remove();
      if (exportButtons) exportButtons.remove();
      if (header) header.remove();

      // Configure PDF options
      const options = {
        margin: [10, 10, 10, 10],
        filename: 'work_report_' + getTimestamp() + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'landscape' 
        }
      };

      html2pdf().from(clonedContent).set(options).save();
      showNotification('Generating PDF...', 'info');

    } catch (error) {
      console.error('PDF export error:', error);
      showNotification('Failed to export PDF', 'error');
    }
  }

  /**
   * Handle print functionality
   */
  function handlePrint() {
    window.print();
  }

  /**
   * ===================================================================
   * 5. UTILITY FUNCTIONS
   * ===================================================================
   */

  /**
   * Get current timestamp for filenames
   * @returns {string} Timestamp string
   */
  function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   */
  function showNotification(message, type = 'info') {
    // Check if global notification system exists
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Fallback: Create simple notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * ===================================================================
   * 6. FORM ENHANCEMENT
   * ===================================================================
   */

  /**
   * Clear all filters
   */
  function clearAllFilters() {
    $('.select2').val(null).trigger('change');
    $('.form-label').removeClass('text-primary-custom');
  }

  // Expose clear function globally if needed
  window.clearWorkReportFilters = clearAllFilters;

})();
