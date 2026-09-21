#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/bin:$PATH"
SSH_ALIAS="seo-prod-deploy"
SSH_CONNECT_TIMEOUT="${SSH_CONNECT_TIMEOUT:-30}"
SSH_CMD=(ssh -o "ConnectTimeout=$SSH_CONNECT_TIMEOUT" -o "ServerAliveInterval=10" -o "ServerAliveCountMax=3")
RSYNC_SSH="ssh -o ConnectTimeout=$SSH_CONNECT_TIMEOUT -o ServerAliveInterval=10 -o ServerAliveCountMax=3"
INCOMING_DIR="/var/www/seo-prod/incoming"
RELEASES_DIR="/var/www/seo-prod/releases"
LIVE_DIR="/var/www/seo-prod/live"
PROMOTE_CMD="/usr/local/sbin/seo-prod-promote-release"
PUBLIC_URL="https://synapsee.ru/"

mode="dry-run"
if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [--dry-run|--approve]" >&2
  exit 2
fi
if [[ $# -eq 1 ]]; then
  case "$1" in
    --dry-run) mode="dry-run" ;;
    --approve) mode="approve" ;;
    *)
      echo "Usage: $0 [--dry-run|--approve]" >&2
      exit 2
      ;;
  esac
fi

release_id="release-$(date -u +%Y%m%d-%H%M%S)"
if [[ ! "$release_id" =~ ^release-[0-9]{8}-[0-9]{6}$ ]]; then
  echo "Invalid generated release id: $release_id" >&2
  exit 1
fi

cd "$ROOT_DIR"

ssh_retry() {
  local attempt
  for attempt in 1 2 3; do
    if "${SSH_CMD[@]}" "$@"; then
      return 0
    fi
    if [[ "$attempt" -lt 3 ]]; then
      echo "SSH attempt $attempt failed; retrying..." >&2
      sleep "$((attempt * 3))"
    fi
  done
  return 1
}

echo "Building local site..."
bash tools/build.sh

for artifact in prototype/dist/index.html prototype/dist/sitemap.xml prototype/dist/404.html; do
  if [[ ! -f "$artifact" ]]; then
    echo "Build artifact missing: $artifact" >&2
    exit 1
  fi
done
echo "Build artifacts OK."

echo "Checking SSH deploy boundary..."
ssh_retry "$SSH_ALIAS" 'set -e
  test "$(id -un)" = "seo-deploy"
  test -w /var/www/seo-prod/incoming
  ! test -w /var/www/seo-prod/releases
  ! test -w /var/www/seo-prod/live
  printf "remote_user=%s\n" "$(id -un)"
  printf "remote_groups=%s\n" "$(id -Gn)"
  printf "incoming_write=yes\n"
  printf "releases_write=no\n"
  printf "live_write=no\n"
'

if [[ "$mode" == "dry-run" ]]; then
  echo "DRY RUN: release id would be: $release_id"
  echo "DRY RUN: would upload prototype/dist/ to $INCOMING_DIR/$release_id/"
  echo "DRY RUN: would promote with sudo -n $PROMOTE_CMD $release_id"
  echo "DRY RUN: would check public HTTPS status at $PUBLIC_URL"
  exit 0
fi

remote_release_dir="$INCOMING_DIR/$release_id"
echo "Creating incoming release: $remote_release_dir"
ssh_retry "$SSH_ALIAS" "mkdir -- '$remote_release_dir'"

echo "Uploading prototype/dist/ to incoming release..."
rsync -az --delete -e "$RSYNC_SSH" prototype/dist/ "$SSH_ALIAS:$remote_release_dir/"

echo "Verifying uploaded artifacts..."
ssh_retry "$SSH_ALIAS" "test -f '$remote_release_dir/index.html' && test -f '$remote_release_dir/sitemap.xml' && test -f '$remote_release_dir/404.html'"

echo "Promoting release: $release_id"
ssh_retry "$SSH_ALIAS" "sudo -n '$PROMOTE_CMD' '$release_id'"

echo "Checking public HTTPS status..."
http_status="$(curl -sS -o /dev/null -w '%{http_code}' "$PUBLIC_URL")"
if [[ "$http_status" != "200" ]]; then
  echo "HTTPS check failed after promote: $http_status" >&2
  exit 1
fi

echo "Release pointers:"
ssh_retry "$SSH_ALIAS" 'printf "current="; readlink -f /var/www/seo-prod/live/current; printf "previous="; readlink -f /var/www/seo-prod/live/previous 2>/dev/null || printf "none\n"'
echo "Deploy completed: HTTPS $http_status"
