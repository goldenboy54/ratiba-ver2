/**
 * View Timetable (viewtimetable.ejs) - JavaScript
 * Handles timetable filtering and print functionality
 */

(function() {
  'use strict';

  // Initialize on page load
  $(document).ready(function() {
    initializeSelect2();
    initializeFormHandlers();
    initializePrintButton();
  });

  /**
   * Initialize Select2 for all dropdowns
   */
  function initializeSelect2() {
    $('.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Select an option',
      allowClear: true
    });
  }

  /**
   * Initialize form auto-submit handlers
   */
  function initializeFormHandlers() {
    // Semester selection auto-submits
    $('#semester').on('change', function() {
      const semester = $(this).val();
      if (semester) {
        $('#semesterForm').submit();
      }
    });

    // Filter selections auto-submit
    $('#filterForm select').on('change', function() {
      $('#filterForm').submit();
    });
  }

  /**
   * Initialize print button functionality
   */
  function initializePrintButton() {
    $('#frontendPrintBtn').on('click', function() {
      printTimetable();
    });
  }

  /**
   * Print timetable in a new window
   */
  function printTimetable() {
    const timetableContent = document.getElementById('timetableContent');
    
    if (!timetableContent) {
      showNotification('No timetable available to print', 'warning');
      return;
    }

    const content = timetableContent.innerHTML;
    const semester = getSemester();
    
    // Create print window
    const printWindow = window.open('', '', 'width=1000,height=800');
    
    if (!printWindow) {
      showNotification('Please allow pop-ups to print the timetable', 'warning');
      return;
    }

    // Build print document
    printWindow.document.write(getPrintHTML(content, semester));
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  /**
   * Get current semester value
   * @returns {string} Semester value
   */
  function getSemester() {
    const semesterInput = document.querySelector('input[name="semester"]');
    return semesterInput ? semesterInput.value : '';
  }

  /**
   * Generate HTML for print window
   * @param {string} content - Timetable table HTML
   * @param {string} semester - Semester value
   * @returns {string} Complete HTML document
   */
  function getPrintHTML(content, semester) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timetable - Semester ${semester}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 20px;
      font-size: 12pt;
    }

    h1, h2 {
      text-align: center;
      margin-bottom: 15px;
    }

    h1 {
      font-size: 20pt;
      color: #2575fc;
      margin-bottom: 10px;
    }

    h2 {
      font-size: 16pt;
      color: #333;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      border: 1px solid #000;
      padding: 8px 6px;
      text-align: center;
      vertical-align: middle;
      line-height: 1.4;
    }

    th {
      background: #343a40;
      color: #fff;
      font-weight: bold;
      font-size: 11pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    tbody tr:nth-child(even) {
      background: #f2f2f2;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    tbody td:first-child {
      font-weight: bold;
      background: #e9ecef;
      white-space: nowrap;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    tbody tr:nth-child(even) td:first-child {
      background: #dee2e6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    td b {
      font-weight: 600;
      color: #000;
    }

    td i {
      color: #666;
      font-style: italic;
    }

    @page {
      size: landscape;
      margin: 15mm;
    }

    @media print {
      body {
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <h1>ARUSHA TECHNICAL COLLEGE</h1>
  <h2>Timetable - Semester ${semester}</h2>
  ${content}
</body>
</html>
    `.trim();
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, danger, info)
   */
  function showNotification(message, type = 'info') {
    // Remove existing temporary alerts
    $('.alert-temporary').remove();

    // Create alert element
    const alertDiv = $(`
      <div class="alert alert-${type} alert-dismissible fade show alert-temporary" role="alert">
        <i class="fa ${getAlertIcon(type)} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `);

    // Style for fixed position
    alertDiv.css({
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: '9999',
      minWidth: '300px',
      maxWidth: '500px',
      animation: 'slideInRight 0.3s ease-out'
    });

    $('body').append(alertDiv);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      alertDiv.fadeOut(300, function() {
        $(this).remove();
      });
    }, 4000);
  }

  /**
   * Get Font Awesome icon for alert type
   * @param {string} type - Alert type
   * @returns {string} Icon class
   */
  function getAlertIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-times-circle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

})();

// Add slide-in animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
