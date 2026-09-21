#!/usr/bin/env bash
set -euo pipefail

base_url="https://synapsee.ru"
routes=(
  "/"
  "/services/"
  "/services/seo-audit/"
  "/pricing/"
  "/cases/"
  "/cases/1/"
  "/contact/"
  "/privacy/"
  "/consent/"
  "/sitemap.xml"
  "/api/audit/challenge"
)

for route in "${routes[@]}"; do
  status="$(curl -sS -o /dev/null -w '%{http_code}' "${base_url}${route}")"
  printf '%s %s\n' "$status" "$route"
  test "$status" = "200"
done

home="$(curl -fsS "${base_url}/")"
cases="$(curl -fsS "${base_url}/cases/")"
privacy="$(curl -fsS "${base_url}/privacy/")"

grep -Fq "Что сейчас происходит с сайтом" <<<"$home"
grep -Fq "Topvisor" <<<"$cases"
grep -Fq "1extraboy@gmail.com" <<<"$privacy"
grep -Fq "/consent/" <<<"$privacy"

echo "Production content markers: OK"
