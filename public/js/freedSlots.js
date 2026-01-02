/**
 * ===================================================================
 * FREED SLOTS JAVASCRIPT
 * Dashboard for viewing and analyzing freed timetable slots with charts
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
    initializeFreedSlots();
  });

  /**
   * Initialize freed slots functionality
   */
  function initializeFreedSlots() {
    initializeSelect2();
    initializeCharts();
    enhancePagination();
  }

  /**
   * ===================================================================
   * 2. SELECT2 INITIALIZATION
   * ===================================================================
   */

  /**
   * Initialize Select2 on filter dropdowns
   */
  function initializeSelect2() {
    if (typeof $.fn.select2 !== 'function') {
      console.warn('Select2 not loaded');
      return;
    }

    $('.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Select an option',
      allowClear: true
    });
  }

  /**
   * ===================================================================
   * 3. CHART INITIALIZATION
   * ===================================================================
   */

  /**
   * Initialize Chart.js visualizations
   */
  function initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not loaded');
      return;
    }

    // Get venue pie chart
    const venueCanvas = document.getElementById('venuePieChart');
    if (venueCanvas) {
      createVenuePieChart(venueCanvas);
    }

    // Get time bar chart
    const timeCanvas = document.getElementById('timeBarChart');
    if (timeCanvas) {
      createTimeBarChart(timeCanvas);
    }
  }

  /**
   * Create venue pie chart
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  function createVenuePieChart(canvas) {
    // Get venue stats data from window (set by EJS)
    const venueData = window.venueStats || [];

    if (venueData.length === 0) {
      displayNoDataMessage(canvas, 'No venue data available');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: venueData.map(v => v.venue || 'Unknown'),
        datasets: [{
          label: 'Times Freed',
          data: venueData.map(v => v.count || 0),
          backgroundColor: [
            '#0d6efd', // Primary Blue
            '#6f42c1', // Purple
            '#198754', // Green
            '#fd7e14', // Orange
            '#dc3545', // Red
            '#20c997', // Teal
            '#6610f2', // Indigo
            '#ffc107'  // Yellow
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create time bar chart
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  function createTimeBarChart(canvas) {
    // Get time stats data from window (set by EJS)
    const timeData = window.timeStats || [];

    if (timeData.length === 0) {
      displayNoDataMessage(canvas, 'No time data available');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: timeData.map(t => t.time || 'Unknown'),
        datasets: [{
          label: 'Slots Freed Count',
          data: timeData.map(t => t.count || 0),
          backgroundColor: '#0d6efd',
          borderColor: '#0a58ca',
          borderWidth: 1,
          borderRadius: 5,
          hoverBackgroundColor: '#0a58ca'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Freed: ${context.parsed.y} times`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              font: {
                size: 11
              }
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Display no data message on canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} message - Message to display
   */
  function displayNoDataMessage(canvas, message) {
    const ctx = canvas.getContext('2d');
    ctx.font = '14px Arial';
    ctx.fillStyle = '#6c757d';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }

  /**
   * ===================================================================
   * 4. PAGINATION ENHANCEMENT
   * ===================================================================
   */

  /**
   * Enhance pagination links with smooth scroll
   */
  function enhancePagination() {
    const paginationLinks = document.querySelectorAll('.pagination .page-link');
    
    paginationLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Scroll to top of data section smoothly
        const dataSection = document.querySelector('.data-section');
        if (dataSection) {
          setTimeout(() => {
            dataSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 100);
        }
      });
    });
  }

  /**
   * ===================================================================
   * 5. FILTER MANAGEMENT
   * ===================================================================
   */

  /**
   * Get active filters
   * @returns {Object} Active filter values
   */
  function getActiveFilters() {
    const venueSelect = document.getElementById('venue_id');
    const daySelect = document.getElementById('day');

    return {
      venue_id: venueSelect ? venueSelect.value : '',
      day: daySelect ? daySelect.value : ''
    };
  }

  /**
   * Check if any filters are active
   * @returns {boolean} True if filters are active
   */
  function hasActiveFilters() {
    const filters = getActiveFilters();
    return filters.venue_id !== '' || filters.day !== '';
  }

  /**
   * ===================================================================
   * 6. TABLE ENHANCEMENTS
   * ===================================================================
   */

  /**
   * Enhance table with data attributes for mobile view
   */
  function enhanceTableForMobile() {
    const table = document.querySelector('.freed-slots-table');
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  }

  // Call on load
  enhanceTableForMobile();

  /**
   * ===================================================================
   * 7. EXPORT FUNCTIONALITY (OPTIONAL)
   * ===================================================================
   */

  /**
   * Export table data to CSV
   */
  function exportToCSV() {
    const table = document.querySelector('.freed-slots-table');
    if (!table) {
      showNotification('No table data to export', 'warning');
      return;
    }

    try {
      let csv = '#,Venue,Day,Start,End,Released By,Reason,Released On\n';

      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          const rowData = Array.from(cells).map(cell => {
            const text = cell.textContent.trim();
            return `"${text.replace(/"/g, '""')}"`;
          });
          csv += rowData.join(',') + '\n';
        }
      });

      downloadCSV(csv, 'freed_slots_' + getTimestamp() + '.csv');
      showNotification('Data exported successfully', 'success');

    } catch (error) {
      console.error('CSV export error:', error);
      showNotification('Failed to export CSV', 'error');
    }
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
   * ===================================================================
   * 8. UTILITY FUNCTIONS
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

    // Fallback: Simple console log
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // Expose export function globally if needed
  window.exportFreedSlotsCSV = exportToCSV;

})();
