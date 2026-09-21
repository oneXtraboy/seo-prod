#!/usr/bin/env bash
set -euo pipefail

cd /opt/n8n
install -d -m 0700 audit-data
if ! grep -q '^AUDIT_HASH_SECRET=' .env; then
  umask 077
  printf 'AUDIT_HASH_SECRET=%s\n' "$(openssl rand -hex 32)" >> .env
fi
docker compose -f docker-compose.yml -f docker-compose.audit.yml up -d --force-recreate audit-api
sleep 2
curl -fsS http://127.0.0.1:5680/health
echo
echo "Synapsee audit API is running on 127.0.0.1:5680."
