#!/usr/bin/env bash
set -euo pipefail

# Usage: ./run_local.sh [build|serve]
# Default action is "serve". The script rebuilds .site_content the same way the
# GitHub Action does (copy #wiki notes, reorganize, preprocess), then runs the
# chosen MkDocs command.

ACTION="${1:-serve}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

for cmd in python3 mkdocs; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing dependency: $cmd" >&2
    echo "Install with: pip install mkdocs mkdocs-material mkdocs-awesome-pages-plugin pymdown-extensions mkdocs-simple-hooks" >&2
    exit 1
  fi
done

echo "==> Cleaning build artifacts"
rm -rf .site_content .site_content_temp site .site_mapping.json
mkdir -p .site_content_temp

echo "==> Copying #wiki-tagged notes, .pages, and Assets to .site_content_temp"
python3 - <<'PY'
import shutil
from pathlib import Path

root = Path('.')
exclusion = {"Journal", "TODO", "Feelings", "Private", "Templates", ".git", ".github", ".scripts", "site", ".site_content"}
tmp = root / '.site_content_temp'
tmp.mkdir(parents=True, exist_ok=True)

def should_skip(rel_parts):
    return any(seg in exclusion for seg in rel_parts)

for path in root.rglob('*.md'):
    rel = path.relative_to(root)
    if should_skip(rel.parts):
        continue
    rel_str = rel.as_posix()
    if rel_str.startswith(('.site_content', 'site/')) or rel_str == 'README.md':
        continue
    text = path.read_text(encoding='utf-8')
    if '#wiki' not in text:
        continue
    dest = tmp / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest)
    print(f"Copied {rel}")

assets = root / 'Assets'
if assets.exists():
    shutil.copytree(assets, tmp / 'Assets')
    print("Copied Assets")
PY

echo "==> Reorganizing content and assets"
python3 .scripts/reorganize_files.py .site_content_temp .site_content .site_mapping.json

echo "==> Copying index and overrides"
if [ -f docs/index.md ]; then
  cp docs/index.md .site_content/
elif [ -f index.md ]; then
  cp index.md .site_content/
fi
if [ -d docs/.overrides ]; then
  cp -R docs/.overrides .site_content/
elif [ -d .overrides ]; then
  cp -R .overrides .site_content/
fi
if [ -d docs/stylesheets ]; then
  cp -R docs/stylesheets .site_content/
fi
if [ -d docs/javascripts ]; then
  cp -R docs/javascripts .site_content/
fi

echo "==> Preprocessing and converting wikilinks"
python3 .scripts/preprocess_dataviews.py
python3 .scripts/convert_wikilinks.py .site_content .site_mapping.json

if [ "$ACTION" = "build" ]; then
  echo "==> Running mkdocs build --clean"
  mkdocs build --clean
elif [ "$ACTION" = "serve" ]; then
  echo "==> Running mkdocs serve"
  mkdocs serve
else
  echo "Unknown action: $ACTION" >&2
  echo "Usage: $0 [build|serve]" >&2
  exit 1
fi
