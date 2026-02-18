#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

LOG_DIR="$REPO_ROOT/.worktrees/logs"
SUMMARY_LOG="$LOG_DIR/deploy-summary.txt"
VERIFY_LOG="$LOG_DIR/catchup-prod-verify.log"

PROD_CATCHUP_URL="https://tinyhumanmd.com/catch-up/"

STAGING_ONLY=0
NO_COLOR=0

usage() {
  cat <<'USAGE'
Usage: ./scripts/catchup-age-prod-orchestrator.sh [--staging-only] [--no-color]

Fast-gated release for catch-up age-range changes:
1) Runs deterministic catch-up age boundary tests
2) Runs build smoke
3) Runs deploy orchestrator with ORCH_ASSUME_YES=1
4) Verifies production catch-up page/assets and writes release report

Required environment:
  CLOUDFLARE_API_TOKEN   Cloudflare API token with Pages deploy permissions

Optional flags:
  --staging-only         Deploy staging only (skip production + prod verification)
  --no-color             Plain output
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --staging-only)
      STAGING_ONLY=1
      ;;
    --no-color)
      NO_COLOR=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument '$1'" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if [ "$NO_COLOR" -eq 1 ]; then
  C_RED=""
  C_GREEN=""
  C_YELLOW=""
  C_RESET=""
else
  C_RED="$(printf '\033[31m')"
  C_GREEN="$(printf '\033[32m')"
  C_YELLOW="$(printf '\033[33m')"
  C_RESET="$(printf '\033[0m')"
fi

info() { printf '[info] %s\n' "$*"; }
warn() { printf '%s[warn]%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
ok() { printf '%s[ok]%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
fail() { printf '%s[error]%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; exit 1; }

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: $cmd"
}

extract_asset_ref() {
  local html_file="$1"
  local pattern="$2"
  grep -Eo "$pattern" "$html_file" | head -n 1
}

assert_contains_file() {
  local file="$1"
  local needle="$2"
  local msg="$3"
  if ! grep -Fq "$needle" "$file"; then
    fail "$msg"
  fi
}

mkdir -p "$LOG_DIR"
: > "$VERIFY_LOG"

require_cmd git
require_cmd npm
require_cmd curl

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  fail "CLOUDFLARE_API_TOKEN is required."
fi

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "Not inside a git repository: $REPO_ROOT"
fi

CURRENT_BRANCH="$(git -C "$REPO_ROOT" symbolic-ref --quiet --short HEAD || true)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  fail "This orchestrator requires branch 'main'. Current branch: ${CURRENT_BRANCH:-detached}"
fi

COMMIT_SHA="$(git -C "$REPO_ROOT" rev-parse HEAD)"
RUN_TS="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
REPORT_TS="$(date -u '+%Y%m%dT%H%M%SZ')"
REPORT_PATH="$REPO_ROOT/docs/CATCHUP_DEPLOY_REPORT_${REPORT_TS}.md"

info "Running catch-up age boundary suite"
(
  cd "$REPO_ROOT"
  npm run test:catchup:age
)

info "Running build smoke"
(
  cd "$REPO_ROOT"
  npm run build
)

DEPLOY_ARGS=("--no-color")
if [ "$NO_COLOR" -eq 0 ]; then
  DEPLOY_ARGS=()
fi
if [ "$STAGING_ONLY" -eq 1 ]; then
  DEPLOY_ARGS+=("--staging-only")
fi

DEPLOY_ARGS_STR=""
if [ "${#DEPLOY_ARGS[@]}" -gt 0 ]; then
  DEPLOY_ARGS_STR="${DEPLOY_ARGS[*]}"
fi

info "Running gated deploy orchestrator (ORCH_ASSUME_YES=1, ALLOW_EXCESS_FEATURES=1)"
(
  cd "$REPO_ROOT"
  if [ "${#DEPLOY_ARGS[@]}" -gt 0 ]; then
    TEST_CMD="npm run test:catchup:age" \
    ALLOW_EXCESS_FEATURES=1 \
    ORCH_ASSUME_YES=1 \
    ./scripts/deploy-orchestrator.sh "${DEPLOY_ARGS[@]}"
  else
    TEST_CMD="npm run test:catchup:age" \
    ALLOW_EXCESS_FEATURES=1 \
    ORCH_ASSUME_YES=1 \
    ./scripts/deploy-orchestrator.sh
  fi
)

STAGING_ALIAS="$(grep -E '^staging_alias:' "$SUMMARY_LOG" | tail -n 1 | sed 's/^staging_alias:[[:space:]]*//' || true)"
PROD_ALIAS="$(grep -E '^production_alias:' "$SUMMARY_LOG" | tail -n 1 | sed 's/^production_alias:[[:space:]]*//' || true)"

HTML_OK="skipped"
ENGINE_OK="skipped"
APP_OK="skipped"
DISCLAIMERS_OK="skipped"
VERIFY_STATUS="skipped"

ENGINE_ASSET_REL=""
APP_ASSET_REL=""

if [ "$STAGING_ONLY" -eq 0 ]; then
  HTML_TMP="$(mktemp)"
  ENGINE_TMP="$(mktemp)"
  APP_TMP="$(mktemp)"
  trap 'rm -f "$HTML_TMP" "$ENGINE_TMP" "$APP_TMP"' EXIT INT TERM

  info "Verifying production catch-up page and deployed JS assets"

  curl -fsSL "$PROD_CATCHUP_URL" -o "$HTML_TMP"
  HTML_OK="pass"

  ENGINE_ASSET_REL="$(extract_asset_ref "$HTML_TMP" 'catch-up-engine\.js\?v=[^" ]+')"
  APP_ASSET_REL="$(extract_asset_ref "$HTML_TMP" 'catch-up\.js\?v=[^" ]+')"

  if [ -z "$ENGINE_ASSET_REL" ]; then
    fail "Production catch-up HTML missing versioned catch-up-engine.js reference."
  fi
  if [ -z "$APP_ASSET_REL" ]; then
    fail "Production catch-up HTML missing versioned catch-up.js reference."
  fi

  assert_contains_file "$HTML_TMP" "Built to support, not replace, clinical judgment." "Production catch-up HTML missing clinical disclaimer marker."
  assert_contains_file "$HTML_TMP" "Not medical advice. Always consult a qualified healthcare provider." "Production catch-up HTML missing short disclaimer marker."
  DISCLAIMERS_OK="pass"

  curl -fsSL "https://tinyhumanmd.com/catch-up/$ENGINE_ASSET_REL" -o "$ENGINE_TMP"
  assert_contains_file "$ENGINE_TMP" "AGE_15_MO = 456" "Production engine JS missing AGE_15_MO boundary marker."
  assert_contains_file "$ENGINE_TMP" "AGE_24_MO = 730" "Production engine JS missing AGE_24_MO boundary marker."
  assert_contains_file "$ENGINE_TMP" "AGE_7_YR = 2557" "Production engine JS missing AGE_7_YR boundary marker."
  assert_contains_file "$ENGINE_TMP" "AGE_18_YR = 6574" "Production engine JS missing AGE_18_YR boundary marker."
  assert_contains_file "$ENGINE_TMP" "AGE_26_YR = 9497" "Production engine JS missing AGE_26_YR boundary marker."
  assert_contains_file "$ENGINE_TMP" "Do not initiate the first dose of rotavirus vaccine at >=15 weeks of age" "Production engine JS missing rotavirus hard-stop guidance string."
  assert_contains_file "$ENGINE_TMP" "Routine Hib catch-up is not recommended at age 5 years or older unless high-risk." "Production engine JS missing Hib age-out guidance string."
  assert_contains_file "$ENGINE_TMP" "Routine PCV catch-up is generally not recommended at age 5 years or older unless high-risk." "Production engine JS missing PCV age-out guidance string."
  ENGINE_OK="pass"

  curl -fsSL "https://tinyhumanmd.com/catch-up/$APP_ASSET_REL" -o "$APP_TMP"
  assert_contains_file "$APP_TMP" "Missing catch-up engine" "Production catch-up app JS missing engine dependency guard marker."
  assert_contains_file "$APP_TMP" "Min age: <strong>" "Production catch-up app JS missing min-age rendering marker."
  APP_OK="pass"

  VERIFY_STATUS="pass"

  {
    echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] production verification complete"
    echo "html: $PROD_CATCHUP_URL"
    echo "engine_asset: https://tinyhumanmd.com/catch-up/$ENGINE_ASSET_REL"
    echo "app_asset: https://tinyhumanmd.com/catch-up/$APP_ASSET_REL"
    echo "checks: html=$HTML_OK disclaimers=$DISCLAIMERS_OK engine=$ENGINE_OK app=$APP_OK"
  } >>"$VERIFY_LOG"

  ok "Production verification passed"
else
  warn "Staging-only run requested; skipping production verification"
fi

cat > "$REPORT_PATH" <<REPORT
# Catch-Up Deploy Report ($REPORT_TS)

- Run timestamp (UTC): $RUN_TS
- Branch: $CURRENT_BRANCH
- Commit: $COMMIT_SHA
- Mode: $( [ "$STAGING_ONLY" -eq 1 ] && echo "staging-only" || echo "staging+production" )

## Commands

- npm run test:catchup:age
- npm run build
- TEST_CMD="npm run test:catchup:age" ALLOW_EXCESS_FEATURES=1 ORCH_ASSUME_YES=1 ./scripts/deploy-orchestrator.sh ${DEPLOY_ARGS_STR}

## Deployment Targets

- Staging alias: ${STAGING_ALIAS:-unknown}
- Production alias: ${PROD_ALIAS:-unknown}

## Production Verification

| Check | Result |
|---|---|
| Production catch-up HTML fetched | $HTML_OK |
| Disclaimer markers present | $DISCLAIMERS_OK |
| Engine asset checks | $ENGINE_OK |
| App asset checks | $APP_OK |
| Overall production verification | $VERIFY_STATUS |

## Asset Refs (if production verified)

- catch-up engine asset: ${ENGINE_ASSET_REL:-n/a}
- catch-up app asset: ${APP_ASSET_REL:-n/a}

## Logs

- Gate log: .worktrees/logs/deploy-gate.log
- Staging log: .worktrees/logs/deploy-staging.log
- Production log: .worktrees/logs/deploy-prod.log
- Deploy summary: .worktrees/logs/deploy-summary.txt
- Production verification log: .worktrees/logs/catchup-prod-verify.log
REPORT

ok "Release report written: $REPORT_PATH"
ok "Catch-up age-range prod orchestrator finished"
