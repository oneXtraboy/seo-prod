#!/usr/bin/env bash
set -euo pipefail

export PATH="/home/onextra/.local/bin:/usr/local/bin:/usr/bin:/bin"
cd /home/onextra/seo-prod/prototype

if [[ ! -d node_modules ]]; then
  npm ci --ignore-scripts
fi

npm run check
node scripts/audit-dist.mjs

echo "OK: production site generated in prototype/dist/"
