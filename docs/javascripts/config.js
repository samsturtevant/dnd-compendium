/**
 * Edit UI Configuration
 * 
 * Set EDIT_API_ENDPOINT to your Cloudflare Worker URL to enable anonymous edit suggestions.
 * If not set, only the "Edit on GitHub" button will be available.
 * 
 * Example:
 * window.EDIT_API_ENDPOINT = 'https://dnd-compendium-edit-api.your-subdomain.workers.dev';
 */

// Leave empty to disable anonymous edits (only GitHub edit button will show)
// Uncomment and set to your worker URL after deploying:
// window.EDIT_API_ENDPOINT = 'https://your-worker-url.workers.dev';

window.EDIT_API_ENDPOINT = null;
