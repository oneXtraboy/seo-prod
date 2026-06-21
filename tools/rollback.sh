#!/usr/bin/env bash
set -euo pipefail

SSH_ALIAS="seo-prod-deploy"
ROLLBACK_CMD="/usr/local/sbin/seo-prod-rollback-release"
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

echo "Checking SSH rollback boundary..."
ssh "$SSH_ALIAS" 'set -e
  test "$(id -un)" = "seo-deploy"
  printf "remote_user=%s\n" "$(id -un)"
  printf "remote_groups=%s\n" "$(id -Gn)"
  printf "current="
  readlink -f /var/www/seo-prod/live/current
  if test -e /var/www/seo-prod/live/previous; then
    printf "previous_exists=yes\n"
    printf "previous="
    readlink -f /var/www/seo-prod/live/previous
  else
    printf "previous_exists=no\n"
  fi
'

if [[ "$mode" == "dry-run" ]]; then
  echo "DRY RUN: would run sudo -n $ROLLBACK_CMD"
  exit 0
fi

echo "Running rollback wrapper..."
ssh "$SSH_ALIAS" "sudo -n '$ROLLBACK_CMD'"

echo "Checking public HTTP status..."
http_status="$(curl -sS -o /dev/null -w '%{http_code}' "$PUBLIC_URL")"
if [[ "$http_status" != "200" ]]; then
  echo "HTTP check failed after rollback: $http_status" >&2
  exit 1
fi

echo "Rollback completed: HTTP $http_status"
