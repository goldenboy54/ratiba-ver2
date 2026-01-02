/**
 * Manual Timetable Generator JavaScript
 * Handles venue/slot selection, day auto-fill, and subject validation
 */

(function() {
  'use strict';

  // ================================================================
  // Module State
  // ================================================================

  let allSlots = [];

  // ================================================================
  // Initialization
  // ================================================================

  $(document).ready(function() {
    // Initialize Select2 on all select elements
    initializeSelect2();

    // Load slots data from server-rendered JSON
    loadSlotsData();

    // Attach event handlers
    attachEventHandlers();
  });

  // ================================================================
  // Select2 Initialization
  // ================================================================

  /**
   * Initialize Select2 with Bootstrap 5 theme
   */
  function initializeSelect2() {
    $('.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Select an option',
      allowClear: true
    });
  }

  // ================================================================
  // Data Loading
  // ================================================================

  /**
   * Load slots data from server-rendered JSON in the DOM
   */
  function loadSlotsData() {
    const slotsDataElement = document.getElementById('slotsData');
    if (slotsDataElement) {
      try {
        allSlots = JSON.parse(slotsDataElement.textContent);
      } catch (error) {
        console.error('Failed to parse slots data:', error);
        allSlots = [];
      }
    }
  }

  // ================================================================
  // Event Handlers
  // ================================================================

  /**
   * Attach all event handlers
   */
  function attachEventHandlers() {
    // Venue selection handler
    $('#venueSelect').on('change', handleVenueChange);

    // Slot selection handler
    $('#slotSelect').on('change', handleSlotChange);

    // Subject selection validation
    $("select[name='subject_ids[]']").on('change', validateSubjectSelection);
  }

  // ================================================================
  // Venue Selection Logic
  // ================================================================

  /**
   * Handle venue selection change
   * Updates available slots based on selected venue
   */
  function handleVenueChange() {
    const venueId = $(this).val();
    const slotSelect = $('#slotSelect');

    // Clear and disable slot dropdown if no venue selected
    if (!venueId) {
      resetSlotDropdown(slotSelect);
      return;
    }

    // Enable slot dropdown
    slotSelect.prop('disabled', false);

    // Filter available slots for the selected venue
    const availableSlots = filterSlotsByVenue(venueId);

    // Populate slot dropdown
    populateSlotDropdown(slotSelect, availableSlots);
  }

  /**
   * Reset slot dropdown to initial state
   * @param {jQuery} slotSelect - The slot select element
   */
  function resetSlotDropdown(slotSelect) {
    slotSelect.empty();
    slotSelect.append('<option>Select Venue First</option>');
    slotSelect.prop('disabled', true);
    $('#day').val('');
  }

  /**
   * Filter slots by venue ID and availability status
   * @param {string} venueId - The selected venue ID
   * @returns {Array} - Array of available slots
   */
  function filterSlotsByVenue(venueId) {
    // Filter slots that match venue and are not used
    const filtered = allSlots.filter(slot => {
      return slot.venue_id == venueId && slot.status !== 'used';
    });

    // Remove duplicate day/slot combinations
    return removeDuplicateSlots(filtered);
  }

  /**
   * Remove duplicate slots based on day and slot combination
   * @param {Array} slots - Array of slots
   * @returns {Array} - Array of unique slots
   */
  function removeDuplicateSlots(slots) {
    const uniqueSlots = [];
    const seen = new Set();

    slots.forEach(slot => {
      const key = `${slot.day}_${slot.slot}`;
      if (!seen.has(key)) {
        uniqueSlots.push(slot);
        seen.add(key);
      }
    });

    return uniqueSlots;
  }

  /**
   * Populate slot dropdown with available slots
   * @param {jQuery} slotSelect - The slot select element
   * @param {Array} slots - Array of available slots
   */
  function populateSlotDropdown(slotSelect, slots) {
    // Clear existing options
    slotSelect.empty();

    // Add default option
    slotSelect.append('<option value="">Select Slot</option>');

    // Add slot options
    slots.forEach(slot => {
      const dayUppercase = slot.day.toUpperCase();
      const optionHtml = `
        <option value="${slot.slot}" data-day="${dayUppercase}">
          ${dayUppercase} (${slot.slot})
        </option>
      `;
      slotSelect.append(optionHtml);
    });

    // Trigger Select2 refresh
    slotSelect.trigger('change.select2');
  }

  // ================================================================
  // Slot Selection Logic
  // ================================================================

  /**
   * Handle slot selection change
   * Auto-fills the day field based on selected slot
   */
  function handleSlotChange() {
    const selectedOption = $(this).find(':selected');
    const day = selectedOption.data('day');
    
    // Update day input field
    $('#day').val(day || '');
  }

  // ================================================================
  // Subject Selection Validation
  // ================================================================

  /**
   * Validate subject selection to ensure only one subject is selected
   * Shows alert and removes extra selections if user tries to select multiple
   */
  function validateSubjectSelection() {
    const selectedSubjects = $(this).val();

    // Check if more than one subject selected
    if (selectedSubjects && selectedSubjects.length > 1) {
      // Show warning
      showNotification(
        'Please select ONLY ONE subject at a time.',
        'warning'
      );

      // Keep only the first selected subject
      $(this).val([selectedSubjects[0]]).trigger('change');
    }
  }

  // ================================================================
  // Notification System
  // ================================================================

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, error, info)
   */
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = $(`
      <div class="notification notification-${type}">
        ${message}
      </div>
    `);

    // Style the notification
    const colors = {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8'
    };

    notification.css({
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: type === 'warning' ? '#000' : '#fff',
      backgroundColor: colors[type] || colors.info,
      fontSize: '14px',
      fontWeight: '600',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideInRight 0.3s ease-out'
    });

    // Append to body
    $('body').append(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  }

  // ================================================================
  // Form Validation
  // ================================================================

  /**
   * Validate form before submission
   */
  function validateForm() {
    const venueId = $('#venueSelect').val();
    const slot = $('#slotSelect').val();
    const day = $('#day').val();
    const subjects = $("select[name='subject_ids[]']").val();

    // Check all required fields
    if (!venueId) {
      showNotification('Please select a venue', 'error');
      return false;
    }

    if (!slot) {
      showNotification('Please select a time slot', 'error');
      return false;
    }

    if (!day) {
      showNotification('Day field is required', 'error');
      return false;
    }

    if (!subjects || subjects.length === 0) {
      showNotification('Please select a subject', 'error');
      return false;
    }

    if (subjects.length > 1) {
      showNotification('Please select only ONE subject', 'error');
      return false;
    }

    return true;
  }

  // Attach form validation to submit button
  $('#assign-btn').on('click', function(e) {
    if (!validateForm()) {
      e.preventDefault();
      return false;
    }
  });

  // ================================================================
  // Utility Functions
  // ================================================================

  /**
   * Clear form fields
   */
  function clearForm() {
    $('#venueSelect').val('').trigger('change');
    $('#slotSelect').empty().append('<option>Select Venue First</option>').prop('disabled', true);
    $('#day').val('');
    $("select[name='subject_ids[]']").val([]).trigger('change');
  }

  // Expose clearForm for external use if needed
  window.manualTimetable = {
    clearForm: clearForm
  };

})();
