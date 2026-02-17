#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
MAX_FEATURE_BRANCHES="${MAX_FEATURE_BRANCHES:-3}"

cd "$REPO_ROOT"

echo "[branch-hygiene] Repo: $REPO_ROOT"
echo "[branch-hygiene] Max active feature branches: $MAX_FEATURE_BRANCHES"

echo ""
echo "Long-lived branches (required):"
printf '  - %s\n' main staging

echo ""
echo "Local feature-style branches:"
local_feature_branches="$(git for-each-ref --format='%(refname:short)' refs/heads | grep -E '^(feature/|aap$|preview/)' || true)"
if [ -z "$local_feature_branches" ]; then
  echo "  (none)"
else
  echo "$local_feature_branches" | sed 's/^/  - /'
fi

local_count="$(printf '%s\n' "$local_feature_branches" | sed '/^$/d' | wc -l | tr -d ' ')"


echo ""
echo "Remote feature-style branches (origin):"
remote_feature_branches="$(git for-each-ref --format='%(refname:short)' refs/remotes/origin | sed 's#^origin/##' | grep -E '^(feature/|aap$|preview/)' || true)"
if [ -z "$remote_feature_branches" ]; then
  echo "  (none)"
else
  echo "$remote_feature_branches" | sed 's/^/  - /'
fi

remote_count="$(printf '%s\n' "$remote_feature_branches" | sed '/^$/d' | wc -l | tr -d ' ')"

echo ""
echo "Counts:"
echo "  local feature-style branches:  $local_count"
echo "  remote feature-style branches: $remote_count"

if [ "$local_count" -gt "$MAX_FEATURE_BRANCHES" ] || [ "$remote_count" -gt "$MAX_FEATURE_BRANCHES" ]; then
  echo ""
  echo "[branch-hygiene] WARNING: branch count exceeds policy limit ($MAX_FEATURE_BRANCHES)."
  exit 2
fi

echo ""
echo "[branch-hygiene] OK: branch counts are within policy limit."
