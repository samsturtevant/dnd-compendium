# D&D Compendium

A D&D campaign compendium built with MkDocs and deployed to GitHub Pages.

## Overview

This repository contains D&D campaign notes stored in markdown files at the root level that are automatically published to GitHub Pages when tagged with `#wiki`.

### Features

- 📝 **Anonymous Edit Suggestions**: Visitors can suggest edits without logging in
- 🔐 **GitHub Edit Fallback**: Contributors can edit directly on GitHub
- 🚀 **Automatic Publishing**: Changes are automatically built and deployed
- 🔍 **Full-Text Search**: Find characters, locations, and lore quickly
- 🎨 **Material Theme**: Clean, responsive design with light/dark modes

## Contributing

We welcome contributions! You can edit pages directly on GitHub:

- Click the **"Edit on GitHub"** button on any page to suggest changes
- All edits go through a pull request review process before being published

### Setting Up the Edit API

If you're maintaining your own fork, see [EDIT_UI_SETUP.md](EDIT_UI_SETUP.md) for instructions on deploying the serverless API that powers anonymous edit suggestions.

## Deployment

The site is automatically built and deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

### How it works

1. **Clean**: Previous build artifacts are removed to ensure a fresh build
2. **Filter**: Only markdown files tagged with `#wiki` are published
3. **Exclude**: Certain folders (Journal, TODO, Feelings, Private, Templates) are never published
4. **Process**: Obsidian-specific syntax (like `[[wikilinks]]` and dataview queries) is converted to standard markdown
5. **Build**: MkDocs builds a static site with Material theme using the `--clean` flag to remove stale files
6. **Deploy**: GitHub Actions deploys the site to GitHub Pages

The workflow ensures that when files are moved or renamed in the repository, old URLs are not retained in the deployed site by cleaning all temporary directories and using MkDocs' `--clean` flag during the build process.

### Configuration

- **MkDocs Config**: `mkdocs.yml` - Material theme with advanced features
- **Workflow**: `.github/workflows/deploy.yml` - Automated build and deployment
- **Scripts**: `.scripts/preprocess_dataviews.py` - Converts Obsidian dataview queries

### GitHub Pages Setup

To enable deployment, ensure GitHub Pages is configured in your repository settings:

1. Go to **Settings** > **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on the next push to `main`

## Local Development

To build and preview the site locally:

```bash
# Install dependencies
pip install mkdocs mkdocs-material mkdocs-awesome-pages-plugin pymdown-extensions mkdocs-simple-hooks

# Clean previous builds (recommended)
rm -rf .site_content .site_content_temp site .site_mapping.json

# Prepare content (manually copy and process files as the workflow does)
mkdir -p .site_content
# ... copy your published files ...

# Build with clean flag and serve locally
mkdocs build --clean
mkdocs serve
```

Visit http://127.0.0.1:8000 to preview the site.

## Site URL

Published at: https://samsturtevant.github.io/dnd-compendium
