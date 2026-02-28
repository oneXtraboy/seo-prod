#!/usr/bin/env bash
set -euo pipefail

# Build static site into /public
node scripts/generate.js
echo "OK: generated public/"
