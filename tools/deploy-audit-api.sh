#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE=seo-vps
REMOTE_DIR=/opt/n8n
BUNDLE_DIR="$(mktemp -d)"
BUNDLE_FILE="$(mktemp)"

cleanup() {
  rm -rf -- "$BUNDLE_DIR"
  rm -f -- "$BUNDLE_FILE"
}
trap cleanup EXIT

install -D -m 0644 "$ROOT_DIR/server/audit-api/server.js" "$BUNDLE_DIR/audit-api/server.js"
install -D -m 0644 "$ROOT_DIR/server/audit-api/enrichment.js" "$BUNDLE_DIR/audit-api/enrichment.js"
install -D -m 0644 "$ROOT_DIR/server/docker-compose.audit.yml" "$BUNDLE_DIR/docker-compose.audit.yml"
install -D -m 0755 "$ROOT_DIR/server/install-audit-nginx.sh" "$BUNDLE_DIR/install-audit-nginx.sh"
install -D -m 0755 "$ROOT_DIR/server/activate-audit.sh" "$BUNDLE_DIR/activate-audit.sh"
install -D -m 0755 "$ROOT_DIR/server/set-audit-email.sh" "$BUNDLE_DIR/set-audit-email.sh"
tar -C "$BUNDLE_DIR" -czf "$BUNDLE_FILE" .

ssh -o BatchMode=yes -o ConnectTimeout=30 "$REMOTE" "cd '$REMOTE_DIR' && tar -xzf - && bash activate-audit.sh" < "$BUNDLE_FILE"
