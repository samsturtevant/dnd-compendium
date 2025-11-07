/**
 * Cloudflare Worker for D&D Compendium Edit Suggestions
 * 
 * This worker handles anonymous edit submissions and creates PRs via GitHub API.
 * 
 * Required Environment Variables (set in Cloudflare Workers dashboard):
 * - GITHUB_TOKEN: Personal access token or GitHub App token with repo scope
 * - GITHUB_REPO: Repository in format "owner/repo" (e.g., "samsturtevant/dnd-compendium")
 * - GITHUB_BASE_BRANCH: Base branch name (usually "main")
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (e.g., "https://samsturtevant.github.io")
 * 
 * Optional Environment Variables:
 * - RATE_LIMIT_PER_HOUR: Number of submissions allowed per IP per hour (default: 5)
 */

// Configuration
const CONFIG = {
  allowedPaths: ['Characters', 'Locations', 'Groups', 'Assets'],
  excludedPaths: ['Journal', 'TODO', 'Feelings', 'Private', 'Templates'],
  rateLimitPerHour: 5,
  maxContentLength: 50000, // 50KB max content size
  maxDescriptionLength: 2000
};

/**
 * Main worker entry point
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle incoming requests
 */
async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Check CORS
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403);
  }

  try {
    // Check rate limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitExceeded = await checkRateLimit(ip);
    if (rateLimitExceeded) {
      return jsonResponse({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, 429);
    }

    // Parse request body
    const body = await request.json();
    
    // Validate submission
    const validation = validateSubmission(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    // Create pull request
    const result = await createPullRequest(body);
    
    // Update rate limit
    await updateRateLimit(ip);

    // Return success response with CORS headers
    return jsonResponse({
      success: true,
      pullRequestNumber: result.number,
      pullRequestUrl: result.html_url
    }, 200, origin);

  } catch (error) {
    console.error('Error handling request:', error);
    return jsonResponse({ 
      error: 'Internal server error. Please try again later.' 
    }, 500, origin);
  }
}

/**
 * Validate edit submission
 */
function validateSubmission(body) {
  // Check required fields
  if (!body.file || !body.description) {
    return { valid: false, error: 'Missing required fields' };
  }

  // Check field lengths
  if (body.description.length > CONFIG.maxDescriptionLength) {
    return { valid: false, error: 'Description too long' };
  }

  if (body.content && body.content.length > CONFIG.maxContentLength) {
    return { valid: false, error: 'Content too long' };
  }

  // Validate file path
  const filePath = body.file;
  
  // Check for path traversal attempts
  if (filePath.includes('..') || filePath.startsWith('/')) {
    return { valid: false, error: 'Invalid file path' };
  }

  // Check against excluded paths
  for (const excluded of CONFIG.excludedPaths) {
    if (filePath.startsWith(excluded + '/') || filePath === excluded) {
      return { valid: false, error: 'This path cannot be edited' };
    }
  }

  // Check against allowed paths
  let isAllowed = false;
  for (const allowed of CONFIG.allowedPaths) {
    if (filePath.startsWith(allowed + '/') || filePath === allowed) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    return { valid: false, error: 'This path is not editable' };
  }

  return { valid: true };
}

/**
 * Create a pull request on GitHub
 */
async function createPullRequest(submission) {
  const token = GITHUB_TOKEN; // Environment variable
  const repo = GITHUB_REPO; // Environment variable (format: "owner/repo")
  const baseBranch = GITHUB_BASE_BRANCH || 'main'; // Environment variable
  
  const [owner, repoName] = repo.split('/');
  
  // Create a unique branch name
  const timestamp = Date.now();
  const sanitizedFile = submission.file.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const branchName = `edit-suggestion/${sanitizedFile}-${timestamp}`;
  
  const githubAPI = `https://api.github.com/repos/${repo}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'DnD-Compendium-Edit-Bot'
  };

  try {
    // 1. Get the SHA of the base branch
    const refResponse = await fetch(`${githubAPI}/git/refs/heads/${baseBranch}`, {
      headers
    });
    
    if (!refResponse.ok) {
      throw new Error(`Failed to get base branch: ${refResponse.statusText}`);
    }
    
    const refData = await refResponse.json();
    const baseSha = refData.object.sha;

    // 2. Create a new branch
    const createRefResponse = await fetch(`${githubAPI}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      })
    });

    if (!createRefResponse.ok) {
      const error = await createRefResponse.text();
      throw new Error(`Failed to create branch: ${error}`);
    }

    // 3. Get current file content (if it exists)
    let currentContent = '';
    let currentSha = null;
    
    try {
      const fileResponse = await fetch(`${githubAPI}/contents/${submission.file}?ref=${baseBranch}`, {
        headers
      });
      
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        currentSha = fileData.sha;
        // Decode base64 content safely
        try {
          currentContent = atob(fileData.content);
        } catch (e) {
          // If atob fails (e.g., invalid base64), treat as empty
          console.error('Failed to decode file content:', e);
          currentContent = '';
        }
      }
    } catch (e) {
      // File doesn't exist yet, which is fine
    }

    // 4. Prepare new content
    let newContent;
    if (submission.content) {
      // User provided full content
      newContent = submission.content;
    } else {
      // User only provided description, append as comment
      // Sanitize description to prevent comment injection
      const sanitizedDescription = submission.description
        .replace(/-->/g, '-- >')
        .replace(/<!--/g, '<! --');
      newContent = currentContent + `\n\n<!-- Suggested edit: ${sanitizedDescription} -->`;
    }

    // 5. Create or update file in the new branch
    const updateFileResponse = await fetch(`${githubAPI}/contents/${submission.file}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Edit suggestion: ${submission.file}\n\n${submission.description}`,
        content: btoa(newContent), // Encode to base64
        branch: branchName,
        sha: currentSha // Include if updating existing file
      })
    });

    if (!updateFileResponse.ok) {
      const error = await updateFileResponse.text();
      throw new Error(`Failed to update file: ${error}`);
    }

    // 6. Create pull request
    const prBody = `
## Edit Suggestion

**Submitted by:** ${submission.name || 'Anonymous Contributor'}

**Description:**
${submission.description}

**File:** \`${submission.file}\`

---

This edit was submitted via the anonymous edit suggestion feature.
Please review the changes and merge if appropriate.
    `.trim();

    const createPRResponse = await fetch(`${githubAPI}/pulls`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `Edit suggestion: ${submission.file}`,
        head: branchName,
        base: baseBranch,
        body: prBody
      })
    });

    if (!createPRResponse.ok) {
      const error = await createPRResponse.text();
      throw new Error(`Failed to create PR: ${error}`);
    }

    const prData = await createPRResponse.json();
    
    return {
      number: prData.number,
      html_url: prData.html_url
    };

  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin) {
  if (!origin) return false;
  
  const allowedOrigins = (ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
  return allowedOrigins.includes(origin);
}

/**
 * Handle CORS preflight
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  
  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200, origin = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

/**
 * Check rate limit for IP address
 * Uses Cloudflare KV for storage (you'll need to bind a KV namespace)
 */
async function checkRateLimit(ip) {
  // If KV is not available, skip rate limiting
  if (typeof RATE_LIMIT_KV === 'undefined') {
    return false;
  }

  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);

  try {
    const data = await RATE_LIMIT_KV.get(key, 'json');
    
    if (!data) {
      return false;
    }

    // Filter out timestamps older than 1 hour
    const recentSubmissions = data.submissions.filter(ts => ts > hourAgo);
    
    const limit = RATE_LIMIT_PER_HOUR || CONFIG.rateLimitPerHour;
    return recentSubmissions.length >= limit;

  } catch (e) {
    console.error('Rate limit check error:', e);
    return false;
  }
}

/**
 * Update rate limit for IP address
 */
async function updateRateLimit(ip) {
  // If KV is not available, skip rate limiting
  if (typeof RATE_LIMIT_KV === 'undefined') {
    return;
  }

  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);

  try {
    let data = await RATE_LIMIT_KV.get(key, 'json');
    
    if (!data) {
      data = { submissions: [] };
    }

    // Add current timestamp and filter old ones
    data.submissions = data.submissions
      .filter(ts => ts > hourAgo)
      .concat([now]);

    // Store with 2 hour expiration
    await RATE_LIMIT_KV.put(key, JSON.stringify(data), {
      expirationTtl: 60 * 60 * 2
    });

  } catch (e) {
    console.error('Rate limit update error:', e);
  }
}
