#!/usr/bin/env bash
set -euo pipefail

SITE_CONFIG=/etc/nginx/sites-available/seo-prod
RATE_CONFIG=/etc/nginx/conf.d/synapsee-audit-limit.conf
STAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP="${SITE_CONFIG}.bak-audit-${STAMP}"

test "$(id -u)" -eq 0 || { echo "Run with sudo." >&2; exit 1; }
test -f "$SITE_CONFIG"
curl -fsS http://127.0.0.1:5680/health >/dev/null

cp -a "$SITE_CONFIG" "$BACKUP"
printf '%s\n' 'limit_req_zone $binary_remote_addr zone=synapsee_audit:10m rate=6r/m;' > "$RATE_CONFIG"

python3 - "$SITE_CONFIG" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
if "location = /api/audit" in text:
    raise SystemExit(0)
needle = """    location / {
        try_files $uri $uri/ =404;
    }
"""
snippet = """    location = /api/audit/challenge {
        limit_req zone=synapsee_audit burst=6 nodelay;
        proxy_pass http://127.0.0.1:5680;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 3s;
        proxy_read_timeout 15s;
    }

    location = /api/audit {
        limit_req zone=synapsee_audit burst=3 nodelay;
        client_max_body_size 16k;
        proxy_pass http://127.0.0.1:5680;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 3s;
        proxy_read_timeout 15s;
    }

"""
if text.count(needle) != 1:
    raise SystemExit("Expected HTTPS static location was not found exactly once")
path.write_text(text.replace(needle, snippet + needle), encoding="utf-8")
PY

if ! nginx -t; then
  cp -a "$BACKUP" "$SITE_CONFIG"
  rm -f "$RATE_CONFIG"
  nginx -t
  echo "Nginx validation failed; configuration restored." >&2
  exit 1
fi

systemctl reload nginx
curl -fsS https://synapsee.ru/api/audit/challenge >/dev/null
echo "Synapsee audit API is connected to HTTPS."

