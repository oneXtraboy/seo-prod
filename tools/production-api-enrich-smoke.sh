#!/usr/bin/env bash
set -euo pipefail

response_file="$(mktemp)"
trap 'rm -f -- "$response_file"' EXIT

status="$(curl -sS \
  -o "$response_file" \
  -w '%{http_code}' \
  -X POST \
  -H 'Origin: https://synapsee.ru' \
  -H 'Content-Type: application/json' \
  --data '{}' \
  'https://synapsee.ru/api/audit?step=enrich')"

test "$status" = "403"
grep -Fq '"code":"enrichment"' "$response_file"
echo "Optional enrichment route: OK (invalid token rejected without creating a lead)"
