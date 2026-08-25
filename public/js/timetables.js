/**
 * Timetables Management JavaScript
 * Handles time slot calculation, Select2 initialization, and form logging
 */

(function() {
  'use strict';

  // ================================================================
  // Time Slots Configuration
  // ================================================================

  const TIME_SLOTS = {
    "07:30": "08:15",
    "08:15": "09:00",
    "09:05": "09:50",
    "09:50": "10:35",
    // Tea break 10:35 - 11:00
    "11:00": "11:45",
    "11:45": "12:30",
    // Lunch break 12:30 - 13:15
    "13:15": "14:00",
    "14:00": "14:45",
    "14:50": "15:35",
    "15:35": "16:20",
    "16:25": "17:10",
    "17:10": "17:55",
    "18:00": "18:45",
    "18:45": "19:30",
    "19:35": "20:20",
    "20:20": "21:05",
    "21:10": "21:55",
    "21:55": "22:40"
  };

  // ================================================================
  // Initialization
  // ================================================================

  document.addEventListener('DOMContentLoaded', function() {
    // Only run on the timetables (system settings) page
    if (!document.getElementById('scode')) {
      return;
    }

    // Initialize Select2
    initializeSelect2();

    // Setup time slot handlers
    setupTimeSlotHandlers();

    // Setup form logging (for debugging)
    setupFormLogging();

    // Setup delete confirmations
    setupDeleteConfirmations();
  });

  // ================================================================
  // Select2 Initialization
  // ================================================================

  /**
   * Initialize Select2 on all select elements
   */
  function initializeSelect2() {
    if (typeof $ !== 'undefined' && $.fn.select2) {
      $('.select2').select2({
        theme: 'bootstrap-5',
        width: '100%',
        placeholder: 'Select an option',
        allowClear: true
      });
    }
  }

  // ================================================================
  // Time Slot Management
  // ================================================================

  /**
   * Setup time slot change handlers for all modals
   */
  function setupTimeSlotHandlers() {
    // Get all modals
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
      const startInput = modal.querySelector('select[name="start_time"]');
      const endInput = modal.querySelector('input[name="end_time"]');

      // Skip if inputs don't exist
      if (!startInput || !endInput) return;

      // Add change event listener to start time
      startInput.addEventListener('change', function() {
        updateEndTime(this, endInput);
      });
    });
  }

  /**
   * Update end time based on start time selection
   * @param {HTMLElement} startInput - Start time select element
   * @param {HTMLElement} endInput - End time input element
   */
  function updateEndTime(startInput, endInput) {
    // Get selected start time (HH:MM format only)
    const selectedTime = startInput.value.substring(0, 5);

    // Find corresponding end time
    if (TIME_SLOTS[selectedTime]) {
      endInput.value = TIME_SLOTS[selectedTime];
    } else {
      endInput.value = '';
    }
  }

  // ================================================================
  // Form Logging (for debugging)
  // ================================================================

  /**
   * Setup form logging for update buttons
   */
  function setupFormLogging() {
    const updateButtons = document.querySelectorAll('button[type="submit"]');

    updateButtons.forEach(button => {
      const buttonText = button.textContent.trim();
      
      // Only attach to Update buttons
      if (buttonText === 'Update') {
        button.addEventListener('click', function(e) {
          const form = this.closest('form');
          if (form) {
            logFormData(form);
          }
        });
      }
    });
  }

  /**
   * Log form data to console for debugging
   * @param {HTMLFormElement} form - The form element
   */
  function logFormData(form) {
    try {
      const formData = new FormData(form);
      const formDataObject = Object.fromEntries(formData.entries());
      console.log('Form Data:', formDataObject);
    } catch (error) {
      console.error('Error logging form data:', error);
    }
  }

  // ================================================================
  // Delete Confirmations
  // ================================================================

  /**
   * Setup delete confirmation handlers
   */
  function setupDeleteConfirmations() {
    // Clean all timetables confirmation
    const cleanAllForms = document.querySelectorAll('form[action*="delete-all"]');
    
    cleanAllForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const confirmed = confirm('Are you sure you want to delete ALL timetables? This action cannot be undone!');
        if (!confirmed) {
          e.preventDefault();
          return false;
        }
      });
    });
  }

  // ================================================================
  // Modal Management
  // ================================================================

  /**
   * Re-initialize Select2 when modals are shown
   */
  $(document).on('shown.bs.modal', '.modal', function() {
    // Re-initialize Select2 for elements inside the modal
    $(this).find('.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Select an option',
      allowClear: true,
      dropdownParent: $(this)
    });
  });

  // ================================================================
  // Form Validation
  // ================================================================

  /**
   * Validate delete reason form
   */
  function validateDeleteForm(form) {
    const reasonSelect = form.querySelector('select[name="reason"]');
    
    if (!reasonSelect || !reasonSelect.value) {
      alert('Please select a reason for deletion');
      return false;
    }

    return true;
  }

  // Attach validation to delete forms
  document.addEventListener('submit', function(e) {
    const form = e.target;
    
    // Check if it's a delete form
    if (form.action && form.action.includes('/timetables/delete/') && !form.action.includes('delete-all')) {
      if (!validateDeleteForm(form)) {
        e.preventDefault();
        return false;
      }
    }
  });

  // ================================================================
  // Utility Functions
  // ================================================================

  /**
   * Format time to HH:MM
   * @param {string} time - Time string
   * @returns {string} - Formatted time
   */
  function formatTime(time) {
    if (!time) return '';
    return time.substring(0, 5);
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };
    
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: '#fff',
      backgroundColor: colors[type] || colors.info,
      fontSize: '14px',
      fontWeight: '600',
      zIndex: '9999',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideInRight 0.3s ease-out'
    });
    
    // Append to body
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // ================================================================
  // Export for external use
  // ================================================================

  window.timetablesManager = {
    TIME_SLOTS: TIME_SLOTS,
    updateEndTime: updateEndTime,
    formatTime: formatTime,
    showNotification: showNotification
  };

})();
