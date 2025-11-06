#!/usr/bin/env python3
"""
Reorganize files from dnd-vault structure to flat, URL-friendly structure.

This script:
1. Removes the 'dnd-vault/' prefix from paths
2. Converts directory names to lowercase
3. Converts file names to URL-friendly slugs (lowercase, spaces to hyphens)
4. Maintains a mapping of original names to new names for wikilink conversion
"""

import os
import re
import json


def slugify(text):
    """Convert text to URL-friendly slug."""
    # Remove file extension if present
    text = text.replace('.md', '')
    # Convert to lowercase
    text = text.lower()
    # Replace spaces and underscores with hyphens
    text = re.sub(r'[\s_]+', '-', text)
    # Remove any characters that aren't alphanumeric, hyphens, or forward slashes
    text = re.sub(r'[^\w\-/]', '', text)
    # Remove multiple consecutive hyphens
    text = re.sub(r'-+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text


def get_new_path(original_path, base_dir='.site_content_temp'):
    """
    Convert original path to new URL-friendly path.
    
    Examples:
        ./Characters/Elaric the Blightwarden.md -> characters/elaric-the-blightwarden.md
        ./Locations/Peapod Public House.md -> locations/peapod-public-house.md
        .site_content_temp/Characters/Foo.md -> characters/foo.md
    """
    # Find and remove the base directory from the path
    parts_list = original_path.split('/')
    
    # Find where base_dir appears in the path
    try:
        base_idx = parts_list.index(base_dir)
        # Get everything after base_dir
        relative_parts = parts_list[base_idx + 1:]
        relative_path = '/'.join(relative_parts)
    except ValueError:
        # base_dir not found, strip leading ./ if present
        if original_path.startswith('./'):
            relative_path = original_path[2:]
        else:
            relative_path = original_path
    
    # Split into directory parts and filename
    parts = relative_path.split('/')
    
    # Process each part
    new_parts = []
    for i, part in enumerate(parts):
        if i == len(parts) - 1:
            # This is the filename
            if part.endswith('.md'):
                # Slugify the filename (without extension)
                name_without_ext = part[:-3]
                new_name = slugify(name_without_ext) + '.md'
                new_parts.append(new_name)
            else:
                new_parts.append(slugify(part))
        else:
            # This is a directory name
            new_parts.append(slugify(part))
    
    return '/'.join(new_parts)


def copy_and_reorganize(source_dir, dest_dir, mapping_file):
    """
    Copy files from source to destination with reorganization.
    
    Also creates a mapping file for wikilink conversion.
    """
    mapping = {}
    pages_count = 0
    
    # Walk through source directory
    for root, dirs, files in os.walk(source_dir):
        for filename in files:
            # Get original path relative to working directory
            original_path = os.path.join(root, filename)
            relative_original = os.path.relpath(original_path, '.')
            
            # Handle .pages files separately - copy them to corresponding dirs
            if filename == '.pages':
                # Get new path for the directory
                dir_path = os.path.dirname(relative_original)
                new_dir_path = get_new_path(dir_path + '/dummy.md')  # Get directory path
                new_dir = os.path.dirname(os.path.join(dest_dir, new_dir_path))
                os.makedirs(new_dir, exist_ok=True)
                
                # Copy .pages file as-is
                new_pages_path = os.path.join(new_dir, '.pages')
                with open(original_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                with open(new_pages_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                pages_count += 1
                print(f"Copied .pages: {relative_original} -> {os.path.relpath(new_pages_path, dest_dir)}")
                continue
            
            # Only process markdown files for mapping
            if not filename.endswith('.md'):
                continue
            
            # Get new path
            new_relative_path = get_new_path(relative_original)
            new_path = os.path.join(dest_dir, new_relative_path)
            
            # Check if the file name (without extension) matches its parent directory name
            # If so, rename it to index.md to make it the section page
            filename_without_ext = os.path.splitext(filename)[0]
            parent_dir_name = os.path.basename(os.path.dirname(original_path))
            
            if filename_without_ext == parent_dir_name:
                # This file should become the index for this section
                new_dir = os.path.dirname(new_path)
                new_path = os.path.join(new_dir, 'index.md')
                # Update the relative path too
                new_relative_path = os.path.relpath(new_path, dest_dir)
                print(f"  -> Converting to section index: {filename}")
            
            # Create directory if needed
            new_dir = os.path.dirname(new_path)
            os.makedirs(new_dir, exist_ok=True)
            
            # Copy file
            with open(original_path, 'r', encoding='utf-8') as f:
                content = f.read()
            with open(new_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Store mapping (original filename -> new path)
            original_name = os.path.splitext(filename)[0]
            new_name = os.path.splitext(os.path.basename(new_path))[0]
            mapping[original_name] = new_relative_path
            
            print(f"Copied: {relative_original} -> {new_relative_path}")
    
    # Save mapping to file
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, indent=2)
    
    print(f"\nMapping saved to {mapping_file}")
    print(f"Total files reorganized: {len(mapping)}")
    if pages_count > 0:
        print(f"Total .pages files copied: {pages_count}")


def copy_assets(source_dir, dest_dir, base_dir='.site_content_temp'):
    """
    Copy asset files (images, etc.) to the destination with reorganization.
    
    Assets are copied to an 'assets' directory at the root.
    """
    # Try to find Assets directory
    # First try in source_dir
    assets_source = os.path.join(source_dir, 'Assets')
    
    # If not found, try looking at the same level as source_dir
    if not os.path.exists(assets_source):
        # Look for Assets at the same level as the source directory
        parent_dir = os.path.dirname(source_dir) if source_dir != '.' else '.'
        assets_source = os.path.join(parent_dir, 'Assets')
    
    if not os.path.exists(assets_source):
        print(f"No Assets directory found (tried: {assets_source})")
        return
    
    assets_dest = os.path.join(dest_dir, 'assets')
    os.makedirs(assets_dest, exist_ok=True)
    
    count = 0
    for root, dirs, files in os.walk(assets_source):
        for filename in files:
            source_file = os.path.join(root, filename)
            # Slugify the filename
            new_filename = slugify(os.path.splitext(filename)[0]) + os.path.splitext(filename)[1]
            dest_file = os.path.join(assets_dest, new_filename)
            
            # Copy file
            with open(source_file, 'rb') as f:
                content = f.read()
            with open(dest_file, 'wb') as f:
                f.write(content)
            
            count += 1
            print(f"Copied asset: {filename} -> assets/{new_filename}")
    
    print(f"Total assets copied: {count}")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) != 4:
        print("Usage: reorganize_files.py <source_dir> <dest_dir> <mapping_file>")
        sys.exit(1)
    
    source_dir = sys.argv[1]
    dest_dir = sys.argv[2]
    mapping_file = sys.argv[3]
    
    copy_and_reorganize(source_dir, dest_dir, mapping_file)
    copy_assets(source_dir, dest_dir)
