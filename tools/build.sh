#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

rm -rf public

node scripts/generate.js

required_files=(
  "public/index.html"
  "public/sitemap.xml"
  "public/404.html"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Build failed: required file missing: $file" >&2
    exit 1
  fi
done

echo "Build completed successfully."
