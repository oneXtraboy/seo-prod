#!/usr/bin/env bash
set -euo pipefail

node_exe="$(find /mnt/c/Users -type f -path '*/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' -print -quit 2>/dev/null || true)"
script_path="$(wslpath -w /home/onextra/seo-prod/tools/analyze-audits.mjs)"
first_audit="$(find /mnt/c/Users -type f -path '*/Downloads/page_titles_same_as_h1.xlsx' -print -quit 2>/dev/null || true)"
downloads="$(dirname "$first_audit")"
artifact_module="$(wslpath -w "$(dirname "$node_exe")/../node_modules/@oai/artifact-tool/dist/artifact_tool.mjs")"

"$node_exe" "$script_path" "$artifact_module" \
  "$(wslpath -w "$downloads/page_titles_same_as_h1.xlsx")" \
  "$(wslpath -w "$downloads/h2_nonsequential.xlsx")" \
  "$(wslpath -w "$downloads/h2_multiple.xlsx")" \
  "$(wslpath -w "$downloads/canonicals_all.xlsx")" \
  "$(wslpath -w "$downloads/meta_keywords_missing.xlsx")"
