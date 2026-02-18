#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

LOG_DIR="$REPO_ROOT/.worktrees/logs"
DEPLOY_WT="$REPO_ROOT/.worktrees/deploy-orchestrator"
GATE_LOG="$LOG_DIR/deploy-gate.log"
STAGING_LOG="$LOG_DIR/deploy-staging.log"
PROD_LOG="$LOG_DIR/deploy-prod.log"
SUMMARY_LOG="$LOG_DIR/deploy-summary.txt"

PROD_PROJECT="tinyhumanmd"
STAGING_PROJECT="tinyhumanmd-staging"

MAX_FEATURE_BRANCHES="${MAX_FEATURE_BRANCHES:-3}"
ALLOW_EXCESS_FEATURES="${ALLOW_EXCESS_FEATURES:-0}"
ORCH_NO_CONFIRM="${ORCH_NO_CONFIRM:-0}"
ORCH_ASSUME_YES="${ORCH_ASSUME_YES:-0}"

STAGING_ONLY=0
NO_COLOR=0

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  cat <<'EOF'
Usage: ./scripts/deploy-orchestrator.sh [--staging-only] [--no-color]

Deploy flow:
1) Strict gate checks (branch policy, marker checks, clean tracked state, smoke test)
2) Deploy staging
3) Optionally deploy production (explicit confirmation only)

Environment variables:
  TEST_CMD               Override smoke command
  MAX_FEATURE_BRANCHES   Policy limit for active feature branches (default: 3)
  ALLOW_EXCESS_FEATURES  1 to continue even if branch-hygiene check exceeds policy
  ORCH_NO_CONFIRM        1 to refuse production confirmation flow (safety)
  ORCH_ASSUME_YES        1 to auto-confirm production deploy on main (non-interactive)
EOF
  exit 0
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --staging-only)
      STAGING_ONLY=1
      ;;
    --no-color)
      NO_COLOR=1
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      exit 1
      ;;
  esac
  shift
done

if [ "$NO_COLOR" -eq 1 ]; then
  C_RED=""
  C_YELLOW=""
  C_GREEN=""
  C_RESET=""
else
  C_RED="$(printf '\033[31m')"
  C_YELLOW="$(printf '\033[33m')"
  C_GREEN="$(printf '\033[32m')"
  C_RESET="$(printf '\033[0m')"
fi

info() {
  printf '[info] %s\n' "$*"
}

warn() {
  printf '%s[warn]%s %s\n' "$C_YELLOW" "$C_RESET" "$*"
}

error() {
  printf '%s[error]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
}

ok() {
  printf '%s[ok]%s %s\n' "$C_GREEN" "$C_RESET" "$*"
}

append_log() {
  local file="$1"
  shift
  printf '%s\n' "$*" >>"$file"
}

run_in_repo_log() {
  local file="$1"
  local cmd="$2"
  append_log "$file" ""
  append_log "$file" "$ $cmd"
  (
    cd "$REPO_ROOT"
    /bin/bash -lc "$cmd"
  ) >>"$file" 2>&1
}

run_in_worktree_log() {
  local file="$1"
  local cmd="$2"
  append_log "$file" ""
  append_log "$file" "$ $cmd"
  (
    cd "$DEPLOY_WT"
    /bin/bash -lc "$cmd"
  ) >>"$file" 2>&1
}

is_managed_worktree_path() {
  git -C "$REPO_ROOT" worktree list --porcelain | awk '/^worktree / {print substr($0, 10)}' | grep -Fx "$DEPLOY_WT" >/dev/null 2>&1
}

cleanup_worktree() {
  if is_managed_worktree_path; then
    git -C "$REPO_ROOT" worktree remove --force "$DEPLOY_WT" >/dev/null 2>&1 || true
  fi
}

fail_and_exit() {
  local code="$1"
  shift
  error "$*"
  append_log "$SUMMARY_LOG" "status: failed"
  append_log "$SUMMARY_LOG" "exit_code: $code"
  append_log "$SUMMARY_LOG" "error: $*"
  append_log "$SUMMARY_LOG" "logs:"
  append_log "$SUMMARY_LOG" "  gate: $GATE_LOG"
  append_log "$SUMMARY_LOG" "  staging: $STAGING_LOG"
  append_log "$SUMMARY_LOG" "  prod: $PROD_LOG"
  append_log "$SUMMARY_LOG" "  summary: $SUMMARY_LOG"
  exit "$code"
}

check_fixed_marker() {
  local file="$1"
  local pattern="$2"
  local message="$3"
  if ! grep -Fq "$pattern" "$file"; then
    fail_and_exit 1 "$message"
  fi
}

check_regex_marker() {
  local file="$1"
  local pattern="$2"
  local message="$3"
  if ! grep -Eq "$pattern" "$file"; then
    fail_and_exit 1 "$message"
  fi
}

print_prune_report() {
  local keep_limit="$1"
  local local_features remote_features combined keep prune total

  local_features="$(git -C "$REPO_ROOT" for-each-ref --sort=-committerdate --format='%(refname:short)' refs/heads | grep -E '^(feature/|aap$|preview/)' || true)"
  remote_features="$(git -C "$REPO_ROOT" for-each-ref --sort=-committerdate --format='%(refname:short)' refs/remotes/origin | sed 's#^origin/##' | grep -E '^(feature/|aap$|preview/)' || true)"

  combined="$(printf '%s\n%s\n' "$remote_features" "$local_features" | sed '/^$/d' | awk '!seen[$0]++')"
  total="$(printf '%s\n' "$combined" | sed '/^$/d' | wc -l | tr -d ' ')"
  keep="$(printf '%s\n' "$combined" | sed '/^$/d' | head -n "$keep_limit")"
  prune="$(printf '%s\n' "$combined" | sed '/^$/d' | tail -n "+$((keep_limit + 1))" || true)"

  append_log "$SUMMARY_LOG" ""
  append_log "$SUMMARY_LOG" "feature_branch_report:"
  append_log "$SUMMARY_LOG" "  total_feature_style: $total"
  append_log "$SUMMARY_LOG" "  keep_limit: $keep_limit"

  echo ""
  echo "Feature Branch Report (policy: keep <= $keep_limit):"
  echo "  total feature-style branches detected: $total"
  if [ -n "$keep" ]; then
    echo "  keep:"
    printf '%s\n' "$keep" | sed 's/^/    - /'
    append_log "$SUMMARY_LOG" "  keep:"
    printf '%s\n' "$keep" | sed 's/^/    - /' >>"$SUMMARY_LOG"
  else
    echo "  keep: (none)"
    append_log "$SUMMARY_LOG" "  keep: (none)"
  fi

  if [ -n "$prune" ]; then
    echo "  candidate_prune:"
    printf '%s\n' "$prune" | sed 's/^/    - /'
    append_log "$SUMMARY_LOG" "  candidate_prune:"
    printf '%s\n' "$prune" | sed 's/^/    - /' >>"$SUMMARY_LOG"

    echo ""
    echo "Suggested cleanup commands (report-only):"
    append_log "$SUMMARY_LOG" "  suggested_cleanup_commands:"
    while IFS= read -r branch; do
      [ -z "$branch" ] && continue
      if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
        echo "    git -C \"$REPO_ROOT\" branch -D \"$branch\""
        append_log "$SUMMARY_LOG" "    git -C \"$REPO_ROOT\" branch -D \"$branch\""
      fi
      if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
        echo "    git -C \"$REPO_ROOT\" push origin --delete \"$branch\""
        append_log "$SUMMARY_LOG" "    git -C \"$REPO_ROOT\" push origin --delete \"$branch\""
      fi
    done <<EOF
$prune
EOF
  else
    echo "  candidate_prune: (none)"
    append_log "$SUMMARY_LOG" "  candidate_prune: (none)"
  fi
}

mkdir -p "$LOG_DIR"
: >"$GATE_LOG"
: >"$STAGING_LOG"
: >"$PROD_LOG"
: >"$SUMMARY_LOG"

trap cleanup_worktree EXIT INT TERM

append_log "$SUMMARY_LOG" "deploy_orchestrator_run: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
append_log "$SUMMARY_LOG" "repo_root: $REPO_ROOT"
append_log "$SUMMARY_LOG" "log_dir: $LOG_DIR"
append_log "$SUMMARY_LOG" "staging_only: $STAGING_ONLY"

info "Running deploy orchestrator from $REPO_ROOT"

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail_and_exit 1 "Not inside a git repository."
fi

if ! command -v git >/dev/null 2>&1; then
  fail_and_exit 1 "Missing required command: git"
fi
WRANGLER_BIN=""
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER_BIN="wrangler"
elif [ -x "$REPO_ROOT/node_modules/.bin/wrangler" ]; then
  WRANGLER_BIN="$REPO_ROOT/node_modules/.bin/wrangler"
else
  fail_and_exit 1 "Missing wrangler CLI. Install dependencies or wrangler globally."
fi

if ! run_in_repo_log "$GATE_LOG" "$WRANGLER_BIN --version"; then
  fail_and_exit 1 "Unable to run wrangler. See $GATE_LOG"
fi

CURRENT_BRANCH="$(git -C "$REPO_ROOT" symbolic-ref --quiet --short HEAD || true)"
if [ -z "$CURRENT_BRANCH" ]; then
  fail_and_exit 1 "Detached HEAD is not allowed. Checkout main or staging."
fi

case "$CURRENT_BRANCH" in
  main|staging)
    ;;
  *)
    fail_and_exit 1 "Branch '$CURRENT_BRANCH' is not deployable. Use main or staging."
    ;;
esac

COMMIT_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
append_log "$SUMMARY_LOG" "branch: $CURRENT_BRANCH"
append_log "$SUMMARY_LOG" "commit: $COMMIT_SHA"

info "Running strict completion gate checks"

set +e
MAX_FEATURE_BRANCHES="$MAX_FEATURE_BRANCHES" "$REPO_ROOT/scripts/branch-hygiene-check.sh" >>"$GATE_LOG" 2>&1
BRANCH_HYGIENE_STATUS=$?
set -e

if [ "$BRANCH_HYGIENE_STATUS" -ne 0 ]; then
  if [ "$BRANCH_HYGIENE_STATUS" -eq 2 ] && [ "$ALLOW_EXCESS_FEATURES" = "1" ]; then
    warn "Feature branch count exceeds policy, continuing because ALLOW_EXCESS_FEATURES=1"
  else
    fail_and_exit 1 "Branch hygiene check failed (exit $BRANCH_HYGIENE_STATUS). See $GATE_LOG"
  fi
fi

check_fixed_marker "$REPO_ROOT/catch-up/index.html" "Built to support, not replace, clinical judgment." "Missing catch-up clinical disclaimer marker."
check_fixed_marker "$REPO_ROOT/catch-up/index.html" "Not medical advice. Always consult a qualified healthcare provider." "Missing catch-up short disclaimer marker."
check_regex_marker "$REPO_ROOT/catch-up/index.html" 'catch-up\.css\?v=' "Missing versioned catch-up CSS URL in catch-up/index.html."
check_regex_marker "$REPO_ROOT/catch-up/index.html" 'catch-up\.js\?v=' "Missing versioned catch-up JS URL in catch-up/index.html."
check_fixed_marker "$REPO_ROOT/catch-up/catch-up.js" "plan-caveats" "Missing catch-up caveat rendering marker in catch-up.js."
check_fixed_marker "$REPO_ROOT/catch-up/catch-up.js" "Min age: <strong>" "Missing catch-up min-age rendering marker in catch-up.js."

if ! git -C "$REPO_ROOT" diff --quiet --ignore-submodules --; then
  fail_and_exit 1 "Unstaged tracked changes detected. Commit or stash before deploy."
fi
if ! git -C "$REPO_ROOT" diff --cached --quiet --ignore-submodules --; then
  fail_and_exit 1 "Staged tracked changes detected. Commit before deploy."
fi

UNTRACKED="$(git -C "$REPO_ROOT" ls-files --others --exclude-standard)"
if [ -n "$UNTRACKED" ]; then
  BAD_UNTRACKED=""
  ALLOWED_UNTRACKED=""
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    case "$path" in
      docs/*|data/intel/*)
        ALLOWED_UNTRACKED="${ALLOWED_UNTRACKED}${path}"$'\n'
        ;;
      .worktrees/*)
        ;;
      *)
        BAD_UNTRACKED="${BAD_UNTRACKED}${path}"$'\n'
        ;;
    esac
  done <<EOF
$UNTRACKED
EOF

  if [ -n "$ALLOWED_UNTRACKED" ]; then
    warn "Allowed untracked files present (non-blocking):"
    printf '%s' "$ALLOWED_UNTRACKED" | sed '/^$/d; s/^/  - /'
  fi

  if [ -n "$BAD_UNTRACKED" ]; then
    append_log "$GATE_LOG" ""
    append_log "$GATE_LOG" "Unexpected untracked files:"
    printf '%s' "$BAD_UNTRACKED" | sed '/^$/d; s/^/  - /' >>"$GATE_LOG"
    fail_and_exit 1 "Unexpected untracked files found. See $GATE_LOG"
  fi
fi

if [ -n "${TEST_CMD:-}" ]; then
  SMOKE_CMD="$TEST_CMD"
elif [ -f "$REPO_ROOT/package.json" ] && grep -Eq '"test"[[:space:]]*:' "$REPO_ROOT/package.json"; then
  SMOKE_CMD="npm test"
else
  SMOKE_CMD="npm run build"
fi
append_log "$SUMMARY_LOG" "smoke_command: $SMOKE_CMD"

if ! run_in_repo_log "$GATE_LOG" "$SMOKE_CMD"; then
  fail_and_exit 1 "Smoke command failed: $SMOKE_CMD. See $GATE_LOG"
fi

ok "Gate checks passed"

if [ -e "$DEPLOY_WT" ] || [ -d "$DEPLOY_WT" ]; then
  if is_managed_worktree_path; then
    git -C "$REPO_ROOT" worktree remove --force "$DEPLOY_WT" >>"$GATE_LOG" 2>&1 || fail_and_exit 1 "Could not reset existing deploy worktree."
  else
    fail_and_exit 1 "Path exists and is not a managed worktree: $DEPLOY_WT"
  fi
fi

if ! git -C "$REPO_ROOT" worktree add --detach "$DEPLOY_WT" "$COMMIT_SHA" >>"$GATE_LOG" 2>&1; then
  fail_and_exit 1 "Failed to create deploy worktree at $DEPLOY_WT"
fi

info "Deploying to staging first"
if ! run_in_worktree_log "$STAGING_LOG" "$WRANGLER_BIN pages deploy . --project-name $STAGING_PROJECT --branch staging"; then
  fail_and_exit 2 "Staging deployment failed. See $STAGING_LOG"
fi
ok "Staging deployment succeeded"

append_log "$SUMMARY_LOG" "staging_project: $STAGING_PROJECT"
append_log "$SUMMARY_LOG" "staging_alias: https://staging.tinyhumanmd-staging.pages.dev"

if [ "$STAGING_ONLY" -eq 1 ]; then
  append_log "$SUMMARY_LOG" "status: staging_only_complete"
  append_log "$SUMMARY_LOG" "exit_code: 0"
  print_prune_report "$MAX_FEATURE_BRANCHES"
  ok "Completed staging-only deploy. Summary: $SUMMARY_LOG"
  exit 0
fi

if [ "$CURRENT_BRANCH" != "main" ]; then
  warn "Current branch is '$CURRENT_BRANCH'; production deploy requires 'main'."
  append_log "$SUMMARY_LOG" "status: staging_complete_production_skipped_non_main"
  append_log "$SUMMARY_LOG" "exit_code: 0"
  print_prune_report "$MAX_FEATURE_BRANCHES"
  ok "Staging deploy complete. Production skipped."
  exit 0
fi

if [ "$ORCH_NO_CONFIRM" = "1" ]; then
  warn "ORCH_NO_CONFIRM=1 set. Refusing production confirmation flow."
  append_log "$SUMMARY_LOG" "status: staging_complete_production_declined_orch_no_confirm"
  append_log "$SUMMARY_LOG" "exit_code: 3"
  print_prune_report "$MAX_FEATURE_BRANCHES"
  exit 3
fi

if [ "$ORCH_ASSUME_YES" = "1" ]; then
  info "ORCH_ASSUME_YES=1 set. Auto-confirming production deployment."
  append_log "$SUMMARY_LOG" "production_confirmation: auto_yes"
else
  if [ ! -t 0 ]; then
    warn "No interactive TTY available for production confirmation."
    append_log "$SUMMARY_LOG" "status: staging_complete_production_declined_no_tty"
    append_log "$SUMMARY_LOG" "exit_code: 3"
    print_prune_report "$MAX_FEATURE_BRANCHES"
    exit 3
  fi

  echo ""
  read -r -p "Deploy commit $COMMIT_SHA to production now? (y/N): " PROD_CONFIRM
  if [ "$PROD_CONFIRM" != "y" ] && [ "$PROD_CONFIRM" != "Y" ]; then
    warn "Production deployment declined."
    append_log "$SUMMARY_LOG" "status: staging_complete_production_declined_user"
    append_log "$SUMMARY_LOG" "exit_code: 3"
    print_prune_report "$MAX_FEATURE_BRANCHES"
    exit 3
  fi
fi

info "Deploying to production"
if ! run_in_worktree_log "$PROD_LOG" "$WRANGLER_BIN pages deploy . --project-name $PROD_PROJECT --branch main"; then
  fail_and_exit 4 "Production deployment failed. See $PROD_LOG"
fi
ok "Production deployment succeeded"

append_log "$SUMMARY_LOG" "production_project: $PROD_PROJECT"
append_log "$SUMMARY_LOG" "production_alias: https://tinyhumanmd.com"
append_log "$SUMMARY_LOG" "status: success"
append_log "$SUMMARY_LOG" "exit_code: 0"

print_prune_report "$MAX_FEATURE_BRANCHES"

echo ""
ok "Deploy orchestrator finished successfully."
echo "Logs:"
echo "  - $GATE_LOG"
echo "  - $STAGING_LOG"
echo "  - $PROD_LOG"
echo "  - $SUMMARY_LOG"
