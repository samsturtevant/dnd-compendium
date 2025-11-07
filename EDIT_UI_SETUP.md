# Edit UI Setup Guide

This guide explains how to set up the anonymous edit submission feature for the D&D Compendium GitHub Pages site.

## Overview

The edit UI provides two ways for users to contribute:

1. **Anonymous Edit Suggestions** (No login required): Users can suggest edits via a form, which creates a pull request automatically
2. **Edit on GitHub** (Login fallback): Users can edit files directly on GitHub (requires GitHub account)

## Architecture

- **Frontend**: JavaScript + CSS in the MkDocs site
- **Backend**: Cloudflare Workers serverless function
- **GitHub Integration**: Via GitHub REST API (Personal Access Token or GitHub App)

## Setup Instructions

### Prerequisites

- A Cloudflare account (free tier works)
- A GitHub Personal Access Token or GitHub App
- Access to your repository settings

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "DnD Compendium Edit API"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (if you need to trigger workflows)
5. Click "Generate token" and copy the token (you won't see it again)

**Alternative: GitHub App** (Recommended for production)

For better security, create a GitHub App instead:

1. Go to Settings → Developer settings → GitHub Apps → New GitHub App
2. Configure:
   - Name: "DnD Compendium Edit Bot"
   - Homepage URL: Your GitHub Pages URL
   - Webhook: Uncheck "Active"
   - Repository permissions:
     - Contents: Read & Write
     - Pull requests: Read & Write
3. Install the app on your repository
4. Generate a private key and save it securely
5. Use the app ID and private key for authentication (requires custom code)

### Step 2: Deploy Cloudflare Worker

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Navigate to worker directory**:
   ```bash
   cd .cloudflare
   ```

4. **Create KV namespace (optional, for rate limiting)**:
   ```bash
   wrangler kv:namespace create "RATE_LIMIT_KV"
   ```
   Copy the namespace ID and add it to `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "your_namespace_id_here"
   ```

5. **Set environment variables**:
   ```bash
   # Set GitHub token
   wrangler secret put GITHUB_TOKEN
   # Paste your token when prompted
   
   # Set repository (format: owner/repo)
   wrangler secret put GITHUB_REPO
   # Enter: samsturtevant/dnd-compendium
   
   # Set base branch
   wrangler secret put GITHUB_BASE_BRANCH
   # Enter: main
   
   # Set allowed origins
   wrangler secret put ALLOWED_ORIGINS
   # Enter: https://samsturtevant.github.io
   ```

6. **Deploy the worker**:
   ```bash
   wrangler deploy
   ```

7. **Note your worker URL**: After deployment, Wrangler will show you the URL (e.g., `https://dnd-compendium-edit-api.your-subdomain.workers.dev`)

### Step 3: Configure the Frontend

1. **Update the site configuration**:
   
   Add a custom configuration file that the site will load. Create `docs/javascripts/config.js`:
   
   ```javascript
   // Edit UI Configuration
   window.EDIT_API_ENDPOINT = 'https://dnd-compendium-edit-api.your-subdomain.workers.dev';
   ```

2. **Update mkdocs.yml** to load config before edit-ui.js:
   ```yaml
   extra_javascript:
     - javascripts/config.js
     - javascripts/edit-ui.js
   ```

3. **Commit and push changes**:
   ```bash
   git add docs/javascripts/config.js mkdocs.yml
   git commit -m "Configure edit API endpoint"
   git push
   ```

### Step 4: Test the Feature

1. **Wait for deployment**: GitHub Actions will rebuild and deploy your site
2. **Visit any editable page**: Navigate to a character, location, or group page
3. **Test anonymous submission**:
   - Click "Suggest an Edit"
   - Fill out the form
   - Submit
   - Verify a PR was created
4. **Test GitHub fallback**:
   - Click "Edit on GitHub"
   - Verify it opens the file in GitHub's editor

## Security Features

### Path Allowlisting

Only these paths can be edited:
- `Characters/`
- `Locations/`
- `Groups/`
- `Assets/`

These paths are always blocked:
- `Journal/`
- `TODO/`
- `Feelings/`
- `Private/`
- `Templates/`

### Anti-Abuse Measures

1. **Honeypot field**: Hidden form field that bots will fill
2. **Rate limiting**: Max 5 submissions per IP per hour (configurable)
3. **Content limits**: 
   - Description: 2000 characters max
   - Content: 50KB max
4. **CORS protection**: Only allowed origins can submit
5. **Path traversal protection**: Blocks `..` and absolute paths

### No Client-Side Secrets

- GitHub token is stored only in Cloudflare Workers environment
- Client-side code never sees authentication credentials
- All PR creation happens server-side

## Troubleshooting

### "Origin not allowed" error

**Cause**: The request is coming from an unexpected origin.

**Fix**: Update the `ALLOWED_ORIGINS` secret in Cloudflare Workers to include your domain:
```bash
wrangler secret put ALLOWED_ORIGINS
# Enter: https://samsturtevant.github.io,https://www.your-domain.com
```

### "Rate limit exceeded" error

**Cause**: Too many submissions from the same IP.

**Fix**: Either wait (limits reset after 1 hour) or increase the limit:
```bash
wrangler secret put RATE_LIMIT_PER_HOUR
# Enter: 10
```

### PR creation fails

**Cause**: GitHub token lacks permissions or is invalid.

**Fix**: 
1. Check token has `repo` scope
2. Verify token hasn't expired
3. Regenerate and update if needed:
   ```bash
   wrangler secret put GITHUB_TOKEN
   ```

### Edit buttons don't appear

**Cause**: Page is not in an editable category.

**Fix**: This is expected behavior. Edit buttons only appear on pages in:
- Characters/
- Locations/
- Groups/
- Assets/

Check the browser console for any JavaScript errors.

### Worker doesn't deploy

**Cause**: Missing dependencies or configuration.

**Fix**:
1. Ensure you're in the `.cloudflare` directory
2. Check `wrangler.toml` is properly configured
3. Try: `wrangler deploy --legacy-env false`

## Monitoring

### View Worker Logs

```bash
wrangler tail
```

This shows real-time logs of requests to your worker.

### Check Rate Limits

If you set up KV namespace:
```bash
wrangler kv:key list --namespace-id=your_namespace_id
```

### Review PRs

All submissions create PRs in your repository. Review them regularly:
- https://github.com/samsturtevant/dnd-compendium/pulls

## Costs

**Cloudflare Workers Free Tier**:
- 100,000 requests per day
- 10ms CPU time per request

This should be more than sufficient for a personal D&D compendium. If you exceed these limits, Cloudflare will email you.

**GitHub API**:
- Rate limit: 5,000 requests per hour for authenticated requests
- This feature uses ~3-4 API calls per submission

## Alternative Implementations

If you prefer not to use Cloudflare Workers, you can:

1. **Use Staticman** (https://staticman.net/)
   - Third-party service for static site contributions
   - Requires less setup but depends on external service

2. **Use GitHub Actions + Issues**
   - Create an issue template for edits
   - Use GitHub Actions to convert issues to PRs
   - More manual but no external dependencies

3. **Remove anonymous submissions**
   - Keep only the "Edit on GitHub" button
   - Simplest option, requires users to have GitHub accounts

## Maintenance

### Rotate GitHub Token

Every 6-12 months, rotate your GitHub token:

1. Generate new token on GitHub
2. Update Cloudflare secret:
   ```bash
   wrangler secret put GITHUB_TOKEN
   ```
3. Revoke old token on GitHub

### Update Worker Code

When updating the worker:

```bash
cd .cloudflare
# Make changes to worker.js
wrangler deploy
```

### Monitor Abuse

Check PRs regularly for spam or abuse. If you receive spam:

1. Close the PR
2. Check worker logs for the IP
3. Consider adding IP blocking or increasing honeypot complexity

## Support

For issues specific to this implementation:
- Check GitHub Actions logs for build errors
- Check Cloudflare Worker logs for API errors
- Review browser console for frontend errors

For general help:
- MkDocs Material: https://squidfunk.github.io/mkdocs-material/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- GitHub API: https://docs.github.com/en/rest
