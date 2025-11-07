/**
 * Edit UI for D&D Compendium
 * Provides both anonymous edit suggestions (via serverless API) and GitHub login fallback
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Serverless API endpoint for anonymous submissions
    // This should be set to your Cloudflare Workers URL after deployment
    apiEndpoint: window.EDIT_API_ENDPOINT || null,
    
    // GitHub repository info
    githubRepo: 'samsturtevant/dnd-compendium',
    githubBranch: 'main',
    
    // Allowed paths for editing (relative to repo root)
    allowedPaths: ['Characters', 'Locations', 'Groups', 'Assets'],
    
    // Excluded paths (never editable)
    excludedPaths: ['Journal', 'TODO', 'Feelings', 'Private', 'Templates'],
    
    // Rate limiting (client-side basic check)
    rateLimitMinutes: 5,
    rateLimitKey: 'edit_last_submit'
  };

  /**
   * Get the current page's source file path
   */
  function getSourceFilePath() {
    // Get current page URL relative to site root
    const path = window.location.pathname;
    const basePath = '/dnd-compendium/';
    
    // Remove base path and trailing slash
    let relativePath = path.replace(basePath, '').replace(/\/$/, '');
    
    // Handle index pages
    if (!relativePath || relativePath === 'index') {
      return null; // Index page is not editable
    }
    
    // Convert URL path back to source file path
    // This is a simplified mapping - in reality you'd need the site mapping JSON
    // For now, we'll construct likely paths
    const parts = relativePath.split('/');
    
    // Capitalize first letter of each part and join
    const filePath = parts.map(part => {
      return part.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }).join('/') + '.md';
    
    return filePath;
  }

  /**
   * Check if current page is editable based on path rules
   */
  function isPageEditable() {
    const filePath = getSourceFilePath();
    if (!filePath) return false;
    
    // Check if path starts with any excluded folder
    for (const excluded of CONFIG.excludedPaths) {
      if (filePath.startsWith(excluded + '/')) {
        return false;
      }
    }
    
    // Check if path starts with any allowed folder
    for (const allowed of CONFIG.allowedPaths) {
      if (filePath.startsWith(allowed + '/')) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get GitHub edit URL for current page
   */
  function getGitHubEditUrl() {
    const filePath = getSourceFilePath();
    if (!filePath) return null;
    
    return `https://github.com/${CONFIG.githubRepo}/edit/${CONFIG.githubBranch}/${filePath}`;
  }

  /**
   * Check rate limit (simple client-side check)
   */
  function checkRateLimit() {
    try {
      const lastSubmit = localStorage.getItem(CONFIG.rateLimitKey);
      if (lastSubmit) {
        const minutesAgo = (Date.now() - parseInt(lastSubmit)) / 1000 / 60;
        if (minutesAgo < CONFIG.rateLimitMinutes) {
          return Math.ceil(CONFIG.rateLimitMinutes - minutesAgo);
        }
      }
      return 0;
    } catch (e) {
      // LocalStorage not available
      return 0;
    }
  }

  /**
   * Set rate limit timestamp
   */
  function setRateLimit() {
    try {
      localStorage.setItem(CONFIG.rateLimitKey, Date.now().toString());
    } catch (e) {
      // LocalStorage not available, ignore
    }
  }

  /**
   * Create edit button UI
   */
  function createEditButtons() {
    if (!isPageEditable()) {
      return;
    }

    const container = document.querySelector('.md-content__inner');
    if (!container) return;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'edit-buttons';
    buttonContainer.innerHTML = `
      <div class="edit-buttons-wrapper">
        ${CONFIG.apiEndpoint ? `
          <button class="md-button md-button--primary suggest-edit-btn" title="Suggest an anonymous edit (no login required)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
            </svg>
            Suggest an Edit
          </button>
        ` : ''}
        <a href="${getGitHubEditUrl()}" class="md-button edit-github-btn" target="_blank" rel="noopener noreferrer" title="Edit on GitHub (requires login)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
          </svg>
          Edit on GitHub
        </a>
      </div>
    `;

    // Insert at the top of content
    container.insertBefore(buttonContainer, container.firstChild);

    // Add event listener for suggest edit button
    if (CONFIG.apiEndpoint) {
      const suggestBtn = buttonContainer.querySelector('.suggest-edit-btn');
      if (suggestBtn) {
        suggestBtn.addEventListener('click', showEditModal);
      }
    }
  }

  /**
   * Show edit modal for anonymous suggestions
   */
  function showEditModal() {
    // Check rate limit
    const waitMinutes = checkRateLimit();
    if (waitMinutes > 0) {
      alert(`Please wait ${waitMinutes} minute(s) before submitting another edit suggestion.`);
      return;
    }

    // Fetch current content
    const filePath = getSourceFilePath();
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
      <div class="edit-modal-overlay"></div>
      <div class="edit-modal-content">
        <div class="edit-modal-header">
          <h2>Suggest an Edit</h2>
          <button class="edit-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="edit-modal-body">
          <p class="edit-modal-info">
            Your suggestion will be submitted as a pull request for review by the maintainers.
            You don't need to log in - just describe your changes below.
          </p>
          <form id="edit-form">
            <div class="form-group">
              <label for="edit-description">What changes would you like to suggest?</label>
              <textarea id="edit-description" name="description" required rows="4" 
                placeholder="Describe your proposed changes..."></textarea>
            </div>
            <div class="form-group">
              <label for="edit-content">Suggested content (optional)</label>
              <textarea id="edit-content" name="content" rows="10" 
                placeholder="Paste or type the updated content here, or leave blank to describe changes only..."></textarea>
            </div>
            <div class="form-group">
              <label for="edit-name">Your name (optional)</label>
              <input type="text" id="edit-name" name="name" placeholder="Anonymous Contributor">
            </div>
            <!-- Honeypot field -->
            <input type="text" name="website" id="edit-website" style="display:none" tabindex="-1" autocomplete="off">
            <input type="hidden" name="file" value="${filePath}">
            <div class="form-actions">
              <button type="button" class="md-button edit-modal-cancel">Cancel</button>
              <button type="submit" class="md-button md-button--primary">Submit Suggestion</button>
            </div>
          </form>
          <div id="edit-result" class="edit-result" style="display:none"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.edit-modal-close');
    const cancelBtn = modal.querySelector('.edit-modal-cancel');
    const overlay = modal.querySelector('.edit-modal-overlay');
    const form = modal.querySelector('#edit-form');

    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    form.addEventListener('submit', handleEditSubmit);

    // Focus first field
    setTimeout(() => {
      modal.querySelector('#edit-description').focus();
    }, 100);
  }

  /**
   * Handle edit form submission
   */
  async function handleEditSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('edit-result');

    // Check honeypot
    if (form.elements.website.value) {
      console.log('Honeypot triggered');
      return false;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Get form data
    const data = {
      file: form.elements.file.value,
      description: form.elements.description.value,
      content: form.elements.content.value,
      name: form.elements.name.value || 'Anonymous Contributor'
    };

    try {
      // Submit to serverless API
      const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success
        resultDiv.className = 'edit-result edit-result-success';
        resultDiv.innerHTML = `
          <h3>✓ Suggestion submitted successfully!</h3>
          <p>Your edit has been submitted as <a href="${result.pullRequestUrl}" target="_blank" rel="noopener noreferrer">pull request #${result.pullRequestNumber}</a>.</p>
          <p>The maintainers will review your suggestion and merge it if appropriate.</p>
        `;
        resultDiv.style.display = 'block';
        form.style.display = 'none';
        
        // Set rate limit
        setRateLimit();
        
        // Close modal after 5 seconds
        setTimeout(() => {
          document.querySelector('.edit-modal').remove();
        }, 5000);
      } else {
        // Error
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Edit submission error:', error);
      resultDiv.className = 'edit-result edit-result-error';
      resultDiv.innerHTML = `
        <h3>⚠ Submission failed</h3>
        <p>${error.message || 'An error occurred. Please try again later or use the "Edit on GitHub" button.'}</p>
      `;
      resultDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Suggestion';
    }
  }

  /**
   * Initialize when DOM is ready
   */
  function init() {
    // Wait for MkDocs to finish rendering
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createEditButtons);
    } else {
      createEditButtons();
    }

    // Re-initialize on navigation (for SPA-style page transitions)
    if (window.navigation) {
      window.navigation.addEventListener('navigate', () => {
        setTimeout(createEditButtons, 100);
      });
    }
  }

  // Start
  init();
})();
