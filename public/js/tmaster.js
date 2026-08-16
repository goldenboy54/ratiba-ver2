/**
 * Auto Generate Timetable (tmaster.ejs) - JavaScript
 * Handles timetable generation with live streaming logs
 */

(function() {
  'use strict';

  // Initialize Select2 on page load
  $(document).ready(function() {
    // Only run on the auto-generate timetable page
    if (!document.getElementById('generateForm')) {
      return;
    }

    initializeSelect2();
    initializeGenerationForm();
  });

  /**
   * Initialize Select2 for semester dropdown
   */
  function initializeSelect2() {
    $('.select2').select2({
      theme: 'bootstrap-5',
      placeholder: '-- Choose Semester --',
      width: '100%'
    });
  }

  /**
   * Initialize timetable generation form
   */
  function initializeGenerationForm() {
    const form = $('#generateForm');
    const generateBtn = $('#generateBtn');
    const semesterSelect = $('#semester');

    form.on('submit', function(e) {
      e.preventDefault();

      const semester = semesterSelect.val();
      
      // Validate semester selection
      if (!semester) {
        showAlert('Please select a semester', 'warning');
        return;
      }

      // Confirm before generating
      if (!confirm(`Generate timetable for Semester ${semester}?\n\nThis will create a new timetable automatically.`)) {
        return;
      }

      // Start generation process
      startGeneration(semester);
    });
  }

  /**
   * Start the timetable generation process
   * @param {string} semester - Selected semester (I or II)
   */
  function startGeneration(semester) {
    // Show UI elements
    showGenerationUI();

    // Disable generate button
    $('#generateBtn').prop('disabled', true);

    // Initialize log output
    $('#logOutput').text('Initializing timetable generation...\n');

    // Flag to track completion
    let generationComplete = false;

    // Start Server-Sent Events for live logs
    const eventSource = new EventSource(`/tmaster/stream-logs?semester=${encodeURIComponent(semester)}`);

    // Handle incoming log messages
    eventSource.onmessage = function(event) {
      const data = event.data.trim();

      if (data === '[DONE]') {
        // Generation completed successfully
        finishSuccess(`Timetable generation completed for semester ${semester}`);
        eventSource.close();
      } else if (data.startsWith('[ERROR]')) {
        // Generation failed
        const errorMessage = data.substring(7);
        finishError(errorMessage);
        eventSource.close();
      } else if (data.includes('All subjects assigned successfully')) {
        // Extra confirmation from log
        finishSuccess(`Timetable generation completed for semester ${semester}`);
        eventSource.close();
      } else {
        // Append log message and scroll to bottom
        appendLog(data);
      }
    };

    // Handle connection errors
    eventSource.onerror = function() {
      if (!generationComplete) {
        finishError('Connection lost during generation. Please check the server.');
        eventSource.close();
      }
    };

    // Trigger generation API call
    fetch('/tmaster/add', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ semester })
    })
    .catch(err => {
      finishError('Failed to start generation: ' + err.message);
    });

    /**
     * Handle successful completion
     */
    function finishSuccess(message) {
      generationComplete = true;
      hideElement('#spinner');
      hideElement('#generationStatus');
      showElement('#completionMessage');
      $('#successText').text(message);
      $('#generateBtn').prop('disabled', false);
    }

    /**
     * Handle error completion
     */
    function finishError(message) {
      generationComplete = true;
      hideElement('#spinner');
      hideElement('#generationStatus');
      showElement('#errorMessage');
      $('#errorText').text(message || 'Unknown error occurred');
      $('#generateBtn').prop('disabled', false);
    }
  }

  /**
   * Show generation UI elements
   */
  function showGenerationUI() {
    showElement('#generationStatus');
    showElement('#logsSection');
    showElement('#spinner');
    hideElement('#completionMessage');
    hideElement('#errorMessage');
  }

  /**
   * Append log message to output
   * @param {string} message - Log message to append
   */
  function appendLog(message) {
    const logOutput = $('#logOutput');
    logOutput.append(message + '\n');
    
    // Auto-scroll to bottom
    logOutput.scrollTop(logOutput[0].scrollHeight);
  }

  /**
   * Show element
   * @param {string} selector - jQuery selector
   */
  function showElement(selector) {
    $(selector).show();
  }

  /**
   * Hide element
   * @param {string} selector - jQuery selector
   */
  function hideElement(selector) {
    $(selector).hide();
  }

  /**
   * Show alert message (Bootstrap alert)
   * @param {string} message - Alert message
   * @param {string} type - Alert type (success, warning, danger, info)
   */
  function showAlert(message, type = 'info') {
    const alertHtml = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    // Prepend to card body
    $('.generation-card .card-body').prepend(alertHtml);
    
    // Auto-dismiss after 5 seconds
    setTimeout(function() {
      $('.alert').fadeOut('slow', function() {
        $(this).remove();
      });
    }, 5000);
  }

})();
