/**
 * Mix Timetable (manageTimetable.ejs) - JavaScript
 * Handles program selection with badges and form submission
 */

(function() {
  'use strict';

  // Track selected programs
  let selectedPrograms = [];

  // Initialize on page load
  $(document).ready(function() {
    // Only run on the mix-programmes (manageTimetable) page
    if (!document.getElementById('programSelect')) {
      return;
    }

    initializeSelect2();
    initializeProgramSelection();
  });

  /**
   * Initialize Select2 for dropdowns
   */
  function initializeSelect2() {
    $('select.select2').select2({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'Select an option',
      allowClear: true
    });
  }

  /**
   * Initialize program selection functionality
   */
  function initializeProgramSelection() {
    const programSelect = document.getElementById('programSelect');
    
    if (!programSelect) {
      console.warn('Program select element not found');
      return;
    }

    // Listen for program selection
    programSelect.addEventListener('change', handleProgramSelection);
  }

  /**
   * Handle program selection from dropdown
   */
  function handleProgramSelection() {
    const programSelect = document.getElementById('programSelect');
    const selectedValue = programSelect.value;
    const selectedText = programSelect.options[programSelect.selectedIndex].text;

    // Validate selection
    if (!selectedValue) {
      return;
    }

    // Check if already selected
    if (selectedPrograms.includes(selectedValue)) {
      showNotification('This program is already selected', 'warning');
      programSelect.selectedIndex = 0;
      return;
    }

    // Add to selected programs
    addProgram(selectedValue, selectedText);

    // Reset dropdown
    programSelect.selectedIndex = 0;
  }

  /**
   * Add program to selection
   * @param {string} id - Program ID
   * @param {string} text - Program display text
   */
  function addProgram(id, text) {
    // Add to tracking array
    selectedPrograms.push(id);

    // Create hidden input for form submission
    createHiddenInput(id);

    // Create badge for visual feedback
    createProgramBadge(id, text);
  }

  /**
   * Create hidden input for form submission
   * @param {string} id - Program ID
   */
  function createHiddenInput(id) {
    const hiddenDiv = document.getElementById('hiddenInputs');
    
    if (!hiddenDiv) {
      console.error('Hidden inputs container not found');
      return;
    }

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'selectedProgramIds';
    input.value = id;
    input.id = 'hidden-' + id;
    
    hiddenDiv.appendChild(input);
  }

  /**
   * Create visual badge for selected program
   * @param {string} id - Program ID
   * @param {string} text - Program display text
   */
  function createProgramBadge(id, text) {
    const listDiv = document.getElementById('selectedProgramsList');
    
    if (!listDiv) {
      console.error('Selected programs list container not found');
      return;
    }

    // Create badge element
    const badge = document.createElement('span');
    badge.className = 'program-badge';
    badge.id = 'span-' + id;
    badge.textContent = text + ' ×';
    badge.setAttribute('role', 'button');
    badge.setAttribute('aria-label', 'Remove ' + text);
    badge.setAttribute('title', 'Click to remove');
    badge.style.cursor = 'pointer';
    
    // Add click handler to remove
    badge.onclick = function() {
      removeProgram(id);
    };

    // Add keyboard support
    badge.onkeydown = function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        removeProgram(id);
      }
    };
    badge.setAttribute('tabindex', '0');
    
    listDiv.appendChild(badge);
  }

  /**
   * Remove program from selection
   * @param {string} id - Program ID to remove
   */
  function removeProgram(id) {
    // Remove from tracking array
    selectedPrograms = selectedPrograms.filter(p => p !== id);

    // Remove hidden input
    const hiddenInput = document.getElementById('hidden-' + id);
    if (hiddenInput) {
      hiddenInput.remove();
    }

    // Remove badge
    const badge = document.getElementById('span-' + id);
    if (badge) {
      // Fade out animation
      badge.style.opacity = '0';
      badge.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        badge.remove();
      }, 200);
    }
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, danger, info)
   */
  function showNotification(message, type = 'info') {
    // Check if alerts already exist
    const existingAlerts = document.querySelectorAll('.alert-temporary');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show alert-temporary`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '80px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.style.maxWidth = '500px';
    alertDiv.style.animation = 'slideInRight 0.3s ease-out';
    
    alertDiv.innerHTML = `
      <i class="fa ${getAlertIcon(type)} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(alertDiv);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          alertDiv.remove();
        }, 300);
      }
    }, 4000);
  }

  /**
   * Get Font Awesome icon for alert type
   * @param {string} type - Alert type
   * @returns {string} - Icon class
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

  // Make removeProgram globally accessible for onclick handlers
  window.removeProgram = removeProgram;

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

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

})();
