/**
 * Registered Subjects/Modules Management JavaScript
 * Handles filtering, exports (CSV, PDF, Print), and Select2 initialization
 */

(function() {
  'use strict';

  // ================================================================
  // Initialization
  // ================================================================

  $(document).ready(function() {
    // Only run on the registered subjects (modules) page
    if (!document.getElementById('filter_name')) {
      return;
    }

    // Initialize Select2 on all select elements
    $('.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Select an option',
      allowClear: true
    });

    // Auto-submit filter form on change
    $('.filterInput').on('change', function() {
      updateFilters();
    });

    // Export button handlers
    $('#downloadCSV').on('click', downloadCSV);
    $('#downloadPDF').on('click', downloadPDF);
    $('#printTable').on('click', printTable);
  });

  // ================================================================
  // Filter Management
  // ================================================================

  /**
   * Updates URL parameters based on filter selections
   */
  function updateFilters() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();

    // Collect all filter values
    $('.filterInput').each(function() {
      const value = $(this).val();
      const name = $(this).attr('name');
      if (value) {
        params.append(name, value);
      }
    });

    // Update URL and reload
    window.location.href = `${url.pathname}?${params.toString()}`;
  }

  // ================================================================
  // CSV Export
  // ================================================================

  /**
   * Exports table data to CSV file
   */
  function downloadCSV() {
    const table = $('.subjects-table');
    let csv = [];

    // Extract headers
    const headers = [];
    table.find('thead th').each(function(index) {
      // Skip the Actions column (last column)
      if (index < table.find('thead th').length - 1) {
        headers.push($(this).text().trim());
      }
    });
    csv.push(headers.join(','));

    // Extract rows
    table.find('tbody tr').each(function() {
      const row = [];
      $(this).find('td').each(function(index) {
        // Skip the Actions column (last column)
        if (index < $(this).parent().find('td').length - 1) {
          let text = $(this).text().trim();
          // Escape quotes and wrap in quotes if contains comma
          text = text.replace(/"/g, '""');
          if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            text = `"${text}"`;
          }
          row.push(text);
        }
      });
      csv.push(row.join(','));
    });

    // Create blob and download
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName('registered_subjects', 'csv'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('CSV downloaded successfully', 'success');
  }

  // ================================================================
  // PDF Export
  // ================================================================

  /**
   * Exports table to PDF using html2canvas and jsPDF
   */
  function downloadPDF() {
    const table = $('.subjects-table')[0];
    
    // Show loading notification
    showNotification('Generating PDF...', 'info');

    html2canvas(table, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      
      const imgWidth = 280; // A4 landscape width minus margins
      const pageHeight = 190; // A4 landscape height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName('registered_subjects', 'pdf'));
      showNotification('PDF downloaded successfully', 'success');
    }).catch(error => {
      console.error('PDF generation failed:', error);
      showNotification('Failed to generate PDF', 'error');
    });
  }

  // ================================================================
  // Print
  // ================================================================

  /**
   * Opens print dialog with table content
   */
  function printTable() {
    const printWindow = window.open('', '', 'width=800,height=600');
    const tableHtml = $('.table-container').html();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Registered Subjects</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #343a40;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .btn-action {
            display: none;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <h1>Registered Subjects</h1>
        ${tableHtml}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  // ================================================================
  // Utility Functions
  // ================================================================

  /**
   * Generates filename with timestamp
   * @param {string} prefix - File prefix
   * @param {string} extension - File extension
   * @returns {string} - Formatted filename
   */
  function fileName(prefix, extension) {
    const d = new Date();
    const date = d.toISOString().slice(0, 10);
    const time = `${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
    return `${prefix}_${date}_${time}.${extension}`;
  }

  /**
   * Shows notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  function showNotification(message, type) {
    // Create notification element
    const notification = $(`
      <div class="notification notification-${type}">
        ${message}
      </div>
    `);

    // Append to body
    $('body').append(notification);

    // Add styles dynamically
    notification.css({
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: 9999,
      animation: 'slideInRight 0.3s ease-out',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });

    // Set background color based on type
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8'
    };
    notification.css('backgroundColor', colors[type] || colors.info);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  }

  // ================================================================
  // Delete Confirmation
  // ================================================================

  /**
   * Handles delete confirmation
   */
  $(document).on('click', '#subjectsTable .btn-action.delete', function(e) {
    if (!confirm('Are you sure you want to delete this subject?')) {
      e.preventDefault();
      return false;
    }
  });

})();
