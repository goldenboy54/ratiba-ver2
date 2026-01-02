/**
 * ===================================================================
 * SELF REGISTER JAVASCRIPT
 * User self-registration with password validation and form handling
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
    initializeSelfRegister();
  });

  /**
   * Initialize self registration functionality
   */
  function initializeSelfRegister() {
    initializePasswordToggle();
    initializePasswordStrength();
    initializeFormValidation();
    initializeAlertDismiss();
  }

  /**
   * ===================================================================
   * 2. PASSWORD TOGGLE
   * ===================================================================
   */

  /**
   * Initialize password show/hide toggle
   */
  function initializePasswordToggle() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('togglePassword');

    if (!passwordInput || !toggleButton) return;

    toggleButton.addEventListener('click', function() {
      togglePasswordVisibility(passwordInput, toggleButton);
    });
  }

  /**
   * Toggle password visibility
   * @param {HTMLInputElement} input - Password input element
   * @param {HTMLButtonElement} button - Toggle button element
   */
  function togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
      input.type = 'text';
      button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      input.type = 'password';
      button.innerHTML = '<i class="fas fa-eye"></i>';
    }
  }

  /**
   * ===================================================================
   * 3. PASSWORD STRENGTH VALIDATION
   * ===================================================================
   */

  /**
   * Initialize password strength indicator
   */
  function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthDiv = document.getElementById('passwordStrength');

    if (!passwordInput || !strengthDiv) return;

    passwordInput.addEventListener('input', function() {
      updatePasswordStrength(passwordInput.value, strengthDiv);
    });
  }

  /**
   * Update password strength indicator
   * @param {string} password - Password value
   * @param {HTMLElement} strengthDiv - Strength indicator element
   */
  function updatePasswordStrength(password, strengthDiv) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    const missingRequirements = [];
    
    if (!checks.length) missingRequirements.push('at least 8 characters');
    if (!checks.uppercase) missingRequirements.push('1 uppercase letter');
    if (!checks.number) missingRequirements.push('1 number');
    if (!checks.special) missingRequirements.push('1 special character');

    let strengthText = '';
    let strengthClass = '';

    if (missingRequirements.length === 0) {
      strengthText = '✓ Strong password!';
      strengthClass = 'strong';
    } else if (missingRequirements.length <= 2) {
      strengthText = `Include: ${missingRequirements.join(', ')}`;
      strengthClass = 'medium';
    } else {
      strengthText = `Password needs: ${missingRequirements.join(', ')}`;
      strengthClass = 'weak';
    }

    strengthDiv.textContent = strengthText;
    strengthDiv.className = `password-strength ${strengthClass}`;
  }

  /**
   * Check if password is strong enough
   * @param {string} password - Password to check
   * @returns {boolean} True if password is strong
   */
  function isPasswordStrong(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  }

  /**
   * ===================================================================
   * 4. FORM VALIDATION
   * ===================================================================
   */

  /**
   * Initialize form validation
   */
  function initializeFormValidation() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', function(event) {
      if (!validateForm(form)) {
        event.preventDefault();
      }
    });

    // Real-time validation on blur
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(input);
      });
    });
  }

  /**
   * Validate entire form
   * @param {HTMLFormElement} form - Form element
   * @returns {boolean} True if form is valid
   */
  function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required]');

    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    // Special password strength check
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      if (!isPasswordStrong(passwordInput.value)) {
        showFieldError(passwordInput, 'Password is not strong enough. Please follow the requirements.');
        passwordInput.focus();
        isValid = false;
      }
    }

    if (!isValid) {
      showNotification('Please fix the errors in the form', 'error');
    }

    return isValid;
  }

  /**
   * Validate individual field
   * @param {HTMLInputElement|HTMLSelectElement} field - Field to validate
   * @returns {boolean} True if field is valid
   */
  function validateField(field) {
    clearFieldError(field);

    // Check if required field is empty
    if (field.hasAttribute('required') && !field.value.trim()) {
      showFieldError(field, 'This field is required');
      return false;
    }

    // Email validation
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
      }
    }

    // Password validation
    if (field.id === 'password' && field.value) {
      if (!isPasswordStrong(field.value)) {
        // Don't show error here, it's shown by strength indicator
        return false;
      }
    }

    showFieldSuccess(field);
    return true;
  }

  /**
   * Show field error
   * @param {HTMLElement} field - Field element
   * @param {string} message - Error message
   */
  function showFieldError(field, message) {
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');

    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
  }

  /**
   * Show field success
   * @param {HTMLElement} field - Field element
   */
  function showFieldSuccess(field) {
    field.classList.add('is-valid');
    field.classList.remove('is-invalid');
    
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  /**
   * Clear field error/success
   * @param {HTMLElement} field - Field element
   */
  function clearFieldError(field) {
    field.classList.remove('is-invalid', 'is-valid');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.remove();
    }
  }

  /**
   * ===================================================================
   * 5. ALERT MANAGEMENT
   * ===================================================================
   */

  /**
   * Initialize alert dismiss functionality
   */
  function initializeAlertDismiss() {
    const closeButtons = document.querySelectorAll('.alert-close');
    
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const alert = button.closest('.alert-custom');
        if (alert) {
          dismissAlert(alert);
        }
      });
    });

    // Auto-dismiss success alerts after 5 seconds
    const successAlerts = document.querySelectorAll('.alert-success-custom');
    successAlerts.forEach(alert => {
      setTimeout(() => {
        dismissAlert(alert);
      }, 5000);
    });
  }

  /**
   * Dismiss alert with animation
   * @param {HTMLElement} alert - Alert element
   */
  function dismissAlert(alert) {
    alert.style.opacity = '0';
    alert.style.transform = 'translateY(-20px)';
    alert.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
      alert.remove();
    }, 300);
  }

  /**
   * ===================================================================
   * 6. UTILITY FUNCTIONS
   * ===================================================================
   */

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, info)
   */
  function showNotification(message, type = 'info') {
    // Check if global notification system exists
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Fallback: Simple alert
    alert(message);
  }

  /**
   * ===================================================================
   * 7. FORM SUBMISSION ENHANCEMENT
   * ===================================================================
   */

  /**
   * Add loading state to submit button
   */
  function addLoadingState() {
    const submitBtn = document.querySelector('.register-submit-btn');
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    }
  }

  /**
   * Remove loading state from submit button
   */
  function removeLoadingState() {
    const submitBtn = document.querySelector('.register-submit-btn');
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
    }
  }

  // Expose functions if needed
  window.selfRegister = {
    addLoadingState,
    removeLoadingState
  };

})();
