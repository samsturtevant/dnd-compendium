# Edit API Serverless Function

This directory contains the Cloudflare Workers serverless function that powers anonymous edit submissions.

## Quick Start

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Set secrets:
   ```bash
   wrangler secret put GITHUB_TOKEN
   wrangler secret put GITHUB_REPO
   wrangler secret put GITHUB_BASE_BRANCH
   wrangler secret put ALLOWED_ORIGINS
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```

5. Note the worker URL and update `docs/javascripts/config.js`:
   ```javascript
   window.EDIT_API_ENDPOINT = 'https://your-worker.workers.dev';
   ```

## Files

- `worker.js` - Main serverless function code
- `wrangler.toml` - Cloudflare Workers configuration
- `README.md` - This file

## Configuration

See [../EDIT_UI_SETUP.md](../EDIT_UI_SETUP.md) for detailed setup instructions.

## Testing Locally

```bash
wrangler dev
```

This starts a local development server at http://localhost:8787

## Security

- Never commit secrets to git
- All secrets are managed via `wrangler secret put`
- Secrets are encrypted and stored in Cloudflare's system
- Worker code has no hardcoded credentials

## Maintenance

### Update worker code
```bash
wrangler deploy
```

### View logs
```bash
wrangler tail
```

### List secrets
```bash
wrangler secret list
```

### Delete a secret
```bash
wrangler secret delete SECRET_NAME
```
