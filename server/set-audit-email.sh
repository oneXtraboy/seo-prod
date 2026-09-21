#!/usr/bin/env bash
set -euo pipefail

cd /opt/n8n
printf 'Вставьте Resend API key (ввод не отображается): '
IFS= read -r -s resend_key
printf '\n'
if [[ ! "$resend_key" =~ ^re_[A-Za-z0-9_-]{16,}$ ]]; then
  echo 'Ключ не похож на Resend API key. Настройки не изменены.' >&2
  exit 1
fi

umask 077
temporary="$(mktemp .env.audit-email.XXXXXX)"
trap 'rm -f -- "$temporary"' EXIT
grep -v -E '^(RESEND_API_KEY|AUDIT_NOTIFY_EMAIL|AUDIT_FROM_EMAIL)=' .env > "$temporary" || true
printf 'RESEND_API_KEY=%s\n' "$resend_key" >> "$temporary"
printf 'AUDIT_NOTIFY_EMAIL=1extraboy@gmail.com\n' >> "$temporary"
printf 'AUDIT_FROM_EMAIL=Synapsee <onboarding@resend.dev>\n' >> "$temporary"
chmod 600 "$temporary"
mv -f -- "$temporary" .env
trap - EXIT
unset resend_key

docker compose -f docker-compose.yml -f docker-compose.audit.yml up -d audit-api
sleep 8
curl -fsS http://127.0.0.1:5680/health >/dev/null
docker exec synapsee-audit-api node -e 'const fs=require("fs");const x=JSON.parse(fs.readFileSync("/data/submissions.json","utf8"));const r=x.at(-1)||{};console.log(JSON.stringify({id:r.id,emailSent:Boolean(r.emailSent),telegramSent:Boolean(r.telegramSent)}))'
echo 'Email-уведомления формы подключены.'
