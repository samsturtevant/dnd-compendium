#!/usr/bin/env python3
"""
Convert Obsidian wikilinks to standard markdown links using the filename mapping.

This script reads the mapping created by reorganize_files.py and converts
wikilinks like [[Page Name]] to [Page Name](path/to/page-name.md)
"""

import json
import re
import os
import sys

# Import slugify function from reorganize_files module
# We need to add the script directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reorganize_files import slugify


def load_mapping(mapping_file):
    """Load the filename mapping."""
    with open(mapping_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def convert_wikilinks(content, mapping):
    """
    Convert wikilinks to markdown links using the mapping.
    
    Handles:
    - [[Page Name]] -> [Page Name](/path/to/page-name.md)
    - [[Page Name|Display Text]] -> [Display Text](/path/to/page-name.md)
    - [[Folder/Page Name]] -> [Page Name](/folder/page-name.md)
    - [[Image.png]] -> ![Image](/assets/image.png) (for images)
    
    Links are absolute from the docs root.
    """
    def replace_wikilink(match):
        full_link = match.group(1)
        
        # Handle display text (e.g., [[Link|Display]])
        if '|' in full_link:
            link_target, display_text = full_link.split('|', 1)
        else:
            link_target = full_link
            display_text = full_link
        
        # Remove any path components from the link target (use just the page name)
        if '/' in link_target:
            link_target = link_target.split('/')[-1]
        
        # Check if this is an image link
        is_image = False
        for ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']:
            if link_target.lower().endswith(ext):
                is_image = True
                break
        
        if is_image:
            # Handle image links - they go to assets/
            name_without_ext = os.path.splitext(link_target)[0]
            ext = os.path.splitext(link_target)[1]
            slug = slugify(name_without_ext)
            image_path = f'assets/{slug}{ext}'
            return f'![{display_text}]({image_path})'
        
        # Remove .md extension if present
        link_target = link_target.replace('.md', '')
        
        # Look up the target in the mapping
        if link_target in mapping:
            new_path = mapping[link_target]
            # Remove .md extension for cleaner URLs
            if new_path.endswith('.md'):
                new_path = new_path[:-3]
            # Ensure path doesn't start with / (use relative paths for MkDocs)
            if new_path.startswith('/'):
                new_path = new_path[1:]
            # Add trailing slash for directory-style URLs
            if not new_path.endswith('/'):
                new_path = new_path + '/'
            return f'[{display_text}]({new_path})'
        else:
            # If not found in mapping, create a simple slugified version
            slug = slugify(link_target)
            print(f"Warning: Link target '{link_target}' not found in mapping, using slug '{slug}/'", file=sys.stderr)
            return f'[{display_text}]({slug}/)'
    
    # Replace wikilinks
    pattern = r'\[\[([^\]]+)\]\]'
    return re.sub(pattern, replace_wikilink, content)


def process_file(filepath, mapping):
    """Process a single markdown file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = convert_wikilinks(content, mapping)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False


def process_directory(directory, mapping):
    """Process all markdown files in a directory."""
    changed_count = 0
    
    for root, dirs, files in os.walk(directory):
        for filename in files:
            if filename.endswith('.md'):
                filepath = os.path.join(root, filename)
                if process_file(filepath, mapping):
                    changed_count += 1
                    print(f"Updated wikilinks in: {filepath}")
    
    print(f"\nTotal files updated: {changed_count}")


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: convert_wikilinks.py <directory> <mapping_file>")
        sys.exit(1)
    
    directory = sys.argv[1]
    mapping_file = sys.argv[2]
    
    mapping = load_mapping(mapping_file)
    process_directory(directory, mapping)
