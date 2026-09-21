#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_ALIAS=seo-prod-deploy
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-30}"
INCOMING_DIR=/var/www/seo-prod/incoming
RELEASES_DIR=/var/www/seo-prod/releases
LIVE_DIR=/var/www/seo-prod/live
PROMOTE_CMD=/usr/local/sbin/seo-prod-promote-release
PUBLIC_URL=https://synapsee.ru/

release_id="release-$(date -u +%Y%m%d-%H%M%S)"
remote_release_dir="$INCOMING_DIR/$release_id"
bundle_file="$(mktemp)"
trap 'rm -f -- "$bundle_file"' EXIT

cd "$ROOT_DIR"
bash tools/build.sh
for artifact in prototype/dist/index.html prototype/dist/sitemap.xml prototype/dist/404.html; do
  test -f "$artifact"
done
tar -C prototype/dist -czf "$bundle_file" .

ssh -o "ConnectTimeout=$SSH_CONNECT_TIMEOUT" -o ServerAliveInterval=10 -o ServerAliveCountMax=3 "$SSH_ALIAS" "set -euo pipefail
  test \"\$(id -un)\" = \"seo-deploy\"
  test -w '$INCOMING_DIR'
  ! test -w '$RELEASES_DIR'
  ! test -w '$LIVE_DIR'
  mkdir -- '$remote_release_dir'
  tar -xzf - -C '$remote_release_dir'
  test -f '$remote_release_dir/index.html'
  test -f '$remote_release_dir/sitemap.xml'
  test -f '$remote_release_dir/404.html'
  sudo -n '$PROMOTE_CMD' '$release_id'
  printf 'current='
  readlink -f '$LIVE_DIR/current'
  printf 'previous='
  readlink -f '$LIVE_DIR/previous' 2>/dev/null || printf 'none\\n'
" < "$bundle_file"

http_status="$(curl -sS -o /dev/null -w '%{http_code}' "$PUBLIC_URL")"
test "$http_status" = 200
echo "Deploy completed: HTTPS $http_status"

