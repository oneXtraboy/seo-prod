#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/bin:$PATH"
SSH_ALIAS="seo-prod-deploy"
INCOMING_DIR="/var/www/seo-prod/incoming"
RELEASES_DIR="/var/www/seo-prod/releases"
LIVE_DIR="/var/www/seo-prod/live"
PROMOTE_CMD="/usr/local/sbin/seo-prod-promote-release"
PUBLIC_URL="http://94.228.112.75/"

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

echo "Building local site..."
bash tools/build.sh

for artifact in public/index.html public/sitemap.xml public/404.html; do
  if [[ ! -f "$artifact" ]]; then
    echo "Build artifact missing: $artifact" >&2
    exit 1
  fi
done
echo "Build artifacts OK."

echo "Checking SSH deploy boundary..."
ssh "$SSH_ALIAS" 'set -e
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
  echo "DRY RUN: would upload public/ to $INCOMING_DIR/$release_id/"
  echo "DRY RUN: would promote with sudo -n $PROMOTE_CMD $release_id"
  exit 0
fi

remote_release_dir="$INCOMING_DIR/$release_id"
echo "Creating incoming release: $remote_release_dir"
ssh "$SSH_ALIAS" "mkdir -- '$remote_release_dir'"

echo "Uploading public/ to incoming release..."
rsync -az --delete -e ssh public/ "$SSH_ALIAS:$remote_release_dir/"

echo "Verifying uploaded artifacts..."
ssh "$SSH_ALIAS" "test -f '$remote_release_dir/index.html' && test -f '$remote_release_dir/sitemap.xml' && test -f '$remote_release_dir/404.html'"

echo "Promoting release: $release_id"
ssh "$SSH_ALIAS" "sudo -n '$PROMOTE_CMD' '$release_id'"

echo "Checking public HTTP status..."
http_status="$(curl -sS -o /dev/null -w '%{http_code}' "$PUBLIC_URL")"
if [[ "$http_status" != "200" ]]; then
  echo "HTTP check failed after promote: $http_status" >&2
  exit 1
fi

echo "Release pointers:"
ssh "$SSH_ALIAS" 'printf "current="; readlink -f /var/www/seo-prod/live/current; printf "previous="; readlink -f /var/www/seo-prod/live/previous 2>/dev/null || printf "none\n"'
echo "Deploy completed: HTTP $http_status"
