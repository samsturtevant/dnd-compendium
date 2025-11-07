# D&D Compendium

A D&D campaign compendium built with MkDocs and deployed to GitHub Pages.

## Overview

This repository contains D&D campaign notes stored in markdown files at the root level that are automatically published to GitHub Pages when tagged with `#wiki`.

## Deployment

The site is automatically built and deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

### How it works

1. **Filter**: Only markdown files tagged with `#wiki` are published
2. **Exclude**: Certain folders (Journal, TODO, Feelings, Private, Templates) are never published
3. **Process**: Obsidian-specific syntax (like `[[wikilinks]]` and dataview queries) is converted to standard markdown
4. **Build**: MkDocs builds a static site with Material theme
5. **Deploy**: GitHub Actions deploys the site to GitHub Pages

### Configuration

- **MkDocs Config**: `mkdocs.yml` - Material theme with advanced features
- **Workflow**: `.github/workflows/deploy.yml` - Automated build and deployment
- **Scripts**: `.scripts/preprocess_dataviews.py` - Converts Obsidian dataview queries

### GitHub Pages Setup

To enable deployment, ensure GitHub Pages is configured in your repository settings:

1. Go to **Settings** > **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on the next push to `main`

## Content Features

### Info Boxes (Wikipedia-style)

You can add an info box to any page by placing a code block with triple backticks at the very beginning of your markdown file. The info box will appear as a styled container in the top-right corner of the page, similar to Wikipedia.

**Syntax:**
```
```
![[image.png]]
Key: Value
Another Key: [[Link]]
```
```

**Example:**
```
```
![[twigbeard.png]]
Affiliations: [[Hollow Root Covenant]]
Favorite Game: [[Twigball]]
Race: Gnome
Status: Alive
```
```

The info box supports:
- Images using `![[image.png]]` syntax (will be displayed at the top)
- Key-value pairs with any text or wikilinks
- Automatic link conversion for wikilinks like `[[Page Name]]`
- Responsive design (full-width on mobile devices)

## Local Development

To build and preview the site locally:

```bash
# Install dependencies
pip install mkdocs mkdocs-material mkdocs-awesome-pages-plugin pymdown-extensions mkdocs-simple-hooks

# Prepare content (manually copy and process files as the workflow does)
mkdir -p .site_content
# ... copy your published files ...

# Build and serve locally
mkdocs serve
```

Visit http://127.0.0.1:8000 to preview the site.

## Site URL

Published at: https://samsturtevant.github.io/dnd-compendium
