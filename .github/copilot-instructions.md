# GitHub Copilot Instructions for D&D Compendium

## Project Overview

This repository is a D&D campaign compendium that converts Obsidian markdown notes into a static website deployed to GitHub Pages. The project uses MkDocs with the Material theme to create a searchable, navigable D&D knowledge base.

## Architecture

### Workflow
1. **Content Creation**: D&D notes are written in Obsidian format in the `dnd-vault/` directory
2. **Filtering**: Only files tagged with `#publish-me` are published
3. **Exclusions**: Certain folders (Journal, TODO, Feelings, Private, Templates) are never published
4. **Preprocessing**: Obsidian-specific syntax is converted to standard markdown
5. **Building**: MkDocs builds the static site
6. **Deployment**: GitHub Actions deploys to GitHub Pages

### Key Components
- **Content**: `dnd-vault/` - Obsidian vault with D&D campaign notes
- **Build Config**: `mkdocs.yml` - MkDocs configuration with Material theme
- **Preprocessing Script**: `.scripts/preprocess_dataviews.py` - Converts Obsidian dataview queries
- **Deployment**: `.github/workflows/deploy.yml` - Automated build and deploy workflow

## File Structure and Conventions

### Content Organization
- `dnd-vault/Assets/` - Images and other assets
- `dnd-vault/Characters/` - Character notes
- `dnd-vault/Factions/` - Faction descriptions
- `dnd-vault/Locations/` - Location details
- `dnd-vault/Sessions/` - Session notes

### Markdown Conventions
- Use `#publish-me` tag to mark files for publication
- Use Obsidian wikilink syntax `[[Page Name]]` for internal links (automatically converted)
- Dataview queries in ` ```dataview ``` ` blocks are converted to placeholders
- Follow standard markdown for headers, lists, and formatting

### Excluded Content
Never publish content from these folders:
- `Journal/`
- `TODO/`
- `Feelings/`
- `Private/`
- `Templates/`

## Development Guidelines

### Adding or Modifying Content
- Place markdown files in appropriate subdirectories of `dnd-vault/`
- Tag files with `#publish-me` to include them in the published site
- Use Obsidian wikilinks `[[Page]]` for cross-references
- Test locally before pushing to main

### Local Development
```bash
# Install dependencies
pip install mkdocs mkdocs-material mkdocs-awesome-pages-plugin pymdown-extensions mkdocs-simple-hooks

# Manually prepare content (or use workflow steps)
mkdir -p .site_content
# Copy published files and preprocess

# Build and serve
mkdocs serve
```

### Modifying the Build Process
- **Workflow**: Edit `.github/workflows/deploy.yml` for CI/CD changes
- **Preprocessing**: Edit `.scripts/preprocess_dataviews.py` for markdown transformations
- **Theme/Config**: Edit `mkdocs.yml` for site appearance and behavior

### Python Scripts
- Python scripts should be Python 3.10+ compatible
- Use standard library where possible
- Follow PEP 8 style guidelines

## Testing

### Before Committing
1. Ensure markdown files are properly formatted
2. Verify `#publish-me` tags are present on files that should be published
3. Check that wikilinks use correct page names
4. Test locally with `mkdocs serve` if making configuration changes

### Deployment Testing
- Push to `main` branch to trigger automatic deployment
- Check GitHub Actions workflow for build success
- Verify published site at https://samsturtevant.github.io/dnd-compendium

## Common Tasks

### Publishing a New Note
1. Create markdown file in appropriate `dnd-vault/` subdirectory
2. Add `#publish-me` tag at the top or in YAML frontmatter
3. Use wikilinks for references to other notes
4. Commit and push to `main`

### Updating Site Configuration
1. Edit `mkdocs.yml` for theme, navigation, or plugin changes
2. Test locally with `mkdocs serve`
3. Commit and push to trigger rebuild

### Modifying Obsidian Preprocessing
1. Edit `.scripts/preprocess_dataviews.py`
2. Test with sample markdown files
3. Update workflow if needed
4. Deploy and verify output

## Dependencies

### Python Packages
- `mkdocs` - Static site generator
- `mkdocs-material` - Material theme for MkDocs
- `mkdocs-awesome-pages-plugin` - Dynamic navigation generation
- `pymdown-extensions>=10.0` - Markdown extensions
- `mkdocs-simple-hooks` - Custom hooks for MkDocs

### GitHub Actions
- `actions/checkout@v3` - Repository checkout
- `actions/setup-python@v3` - Python environment setup
- `actions/upload-pages-artifact@v2` - Artifact upload
- `actions/deploy-pages@v2` - GitHub Pages deployment

## Troubleshooting

### Common Issues
- **Missing pages**: Check for `#publish-me` tag and verify file isn't in excluded folder
- **Broken links**: Ensure wikilink targets exist and are published
- **Build failures**: Check GitHub Actions logs for specific errors
- **Styling issues**: Review `mkdocs.yml` theme configuration

### Debug Steps
1. Check GitHub Actions workflow run logs
2. Test locally with `mkdocs serve`
3. Verify file paths and naming conventions
4. Check for syntax errors in markdown files
