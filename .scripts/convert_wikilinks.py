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


def calculate_relative_path(from_file, to_file):
    """
    Calculate relative path from one file to another.
    
    Args:
        from_file: Source file path (e.g., 'characters/npcs/elaric-the-blightwarden.md')
        to_file: Target file path (e.g., 'groups/hollow-root-covenant/hollow-root-covenant.md')
    
    Returns:
        Relative path (e.g., '../../../groups/hollow-root-covenant/hollow-root-covenant/')
    """
    if not from_file:
        # If no source file is provided, use root-relative path with leading /
        # This maintains backward compatibility but won't work for subdirectory deployments
        if to_file.endswith('.md'):
            to_file = to_file[:-3]
        if not to_file.endswith('/'):
            to_file = to_file + '/'
        if not to_file.startswith('/'):
            to_file = '/' + to_file
        return to_file
    
    # Get directory of source file
    from_dir = os.path.dirname(from_file)
    
    # Split paths into components
    from_parts = from_dir.split('/') if from_dir else []
    to_parts = to_file.split('/')
    
    # Remove .md extension from target
    if to_parts and to_parts[-1].endswith('.md'):
        to_parts[-1] = to_parts[-1][:-3]
    
    # Find common prefix
    common_len = 0
    for i in range(min(len(from_parts), len(to_parts) - 1)):
        if from_parts[i] == to_parts[i]:
            common_len += 1
        else:
            break
    
    # Build relative path
    # Go up from source directory
    up_levels = len(from_parts) - common_len
    rel_parts = ['..'] * up_levels
    
    # Add target path components after common prefix
    rel_parts.extend(to_parts[common_len:])
    
    # Join and add trailing slash
    rel_path = '/'.join(rel_parts)
    if not rel_path.endswith('/'):
        rel_path = rel_path + '/'
    
    return rel_path


def load_mapping(mapping_file):
    """Load the filename mapping."""
    with open(mapping_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def convert_wikilinks(content, mapping, source_file=None):
    """
    Convert wikilinks to markdown links using the mapping.
    
    Handles:
    - [[Page Name]] -> [Page Name](../../path/to/page-name/)
    - [[Page Name|Display Text]] -> [Display Text](../../path/to/page-name/)
    - [[Folder/Page Name]] -> [Page Name](../../folder/page-name/)
    - [[Image.png]] -> ![Image](../../assets/image.png) (for images)
    
    Links are relative to the source file location.
    
    Args:
        content: The markdown content to process
        mapping: Dictionary mapping page names to their paths
        source_file: Path to the source file (optional, used for relative path calculation)
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
            # Calculate relative path to assets
            if source_file:
                image_path = calculate_relative_path(source_file, f'assets/{slug}{ext}')
            else:
                image_path = f'/assets/{slug}{ext}'
            return f'![{display_text}]({image_path})'
        
        # Remove .md extension if present
        link_target = link_target.replace('.md', '')
        
        # Look up the target in the mapping
        if link_target in mapping:
            target_path = mapping[link_target]
            # Calculate relative path from source to target
            new_path = calculate_relative_path(source_file, target_path)
            return f'[{display_text}]({new_path})'
        else:
            # If not found in mapping, create a simple slugified version
            slug = slugify(link_target)
            if source_file:
                print(f"Warning: Link target '{link_target}' not found in mapping, using slug '{slug}/'", file=sys.stderr)
                # Try to create a reasonable relative path
                new_path = calculate_relative_path(source_file, f'{slug}.md')
            else:
                print(f"Warning: Link target '{link_target}' not found in mapping, using slug '/{slug}/'", file=sys.stderr)
                new_path = f'/{slug}/'
            return f'[{display_text}]({new_path})'
    
    # Replace wikilinks
    pattern = r'\[\[([^\]]+)\]\]'
    return re.sub(pattern, replace_wikilink, content)


def process_file(filepath, mapping, docs_dir='.site_content'):
    """Process a single markdown file.
    
    Args:
        filepath: Path to the file to process
        mapping: Dictionary mapping page names to their paths
        docs_dir: The docs directory (used to calculate relative paths)
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Get the relative path from docs_dir for proper link calculation
    if filepath.startswith(docs_dir + '/'):
        relative_path = filepath[len(docs_dir) + 1:]
    else:
        relative_path = filepath
    
    new_content = convert_wikilinks(content, mapping, relative_path)
    
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
                if process_file(filepath, mapping, directory):
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
