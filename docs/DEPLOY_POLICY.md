# TinyHumanMD Deploy Policy

## Branch to Environment Mapping

- `main` -> production (`tinyhumanmd`)
- `staging` -> staging (`tinyhumanmd-staging`)
- feature branches -> temporary preview deployments only

## Allowed Active Preview Branches

Keep no more than 2-3 active feature preview branches at any time.
Current allowlist:

- `aap`
- `feature/new-work-20260216`

## Manual Preview Prune Checklist

1. Delete stale feature branches locally and on `origin`.
2. Remove stale preview deployments in Cloudflare Pages dashboard.
3. Keep only:
   - production deployment from `main`
   - staging deployment from `staging`
   - up to 2-3 active feature previews
4. Run `scripts/branch-hygiene-check.sh` and confirm branch counts are within policy.

## Service Worker Cache Bust Rule

For user-visible regressions involving stale frontend assets:

1. Bump `CACHE_NAME` in `sw.js`.
2. Update service worker registration URL query version (for example `/sw.js?v=...`) on all pages.
3. Deploy staging, verify cache refresh behavior, then deploy production.

## Deploy Orchestrator (Deploy If Done)

Use `scripts/deploy-orchestrator.sh` for gated deploys with deterministic logs.

### Command

```bash
./scripts/deploy-orchestrator.sh
```

Prerequisite: `wrangler` must be available either globally or at `node_modules/.bin/wrangler`.

Optional flags:

- `--staging-only` (skip production step)
- `--no-color` (plain output)

Optional environment:

- `ORCH_ASSUME_YES=1` (auto-confirm production deploy on `main` after successful staging + gates)

### What It Gates Before Deploy

1. Branch policy (`main` or `staging` only)
2. Feature-branch hygiene (`scripts/branch-hygiene-check.sh`)
3. Catch-up fix markers:
   - disclaimer text in `catch-up/index.html`
   - versioned catch-up asset URLs in `catch-up/index.html`
   - caveat/min-age rendering markers in `catch-up/catch-up.js`
4. Clean tracked worktree (no staged/unstaged tracked-file edits)
5. Smoke command:
   - `TEST_CMD` if provided
   - otherwise `npm test` if present
   - otherwise `npm run build`

The orchestrator allows untracked files only under `docs/` and `data/intel/` (warn-only).

### Logs and Summary

Logs are written to `.worktrees/logs/`:

- `deploy-gate.log`
- `deploy-staging.log`
- `deploy-prod.log`
- `deploy-summary.txt`

### Exit Codes

- `0`: success (staging complete, and production if confirmed)
- `1`: precondition/gate failure
- `2`: staging deploy failed
- `3`: production declined/skipped after staging
- `4`: production deploy failed

### Safety Defaults

- Staging always deploys first.
- Production is interactive by default.
- `ORCH_NO_CONFIRM=1` refuses production step.
- Branch/deployment pruning is report-only (commands are suggested, not executed).

## Catch-Up Fast-Gated YOLO Path

Use `scripts/catchup-age-prod-orchestrator.sh` when the release target is catch-up age-range behavior and you want non-interactive promotion to production with deterministic gates.

### Command

```bash
CLOUDFLARE_API_TOKEN=... ./scripts/catchup-age-prod-orchestrator.sh
```

### What It Adds

1. Runs `npm run test:catchup:age` before deploy.
2. Runs `npm run build` smoke.
3. Runs deploy orchestrator with:
   - `TEST_CMD="npm run test:catchup:age"`
   - `ALLOW_EXCESS_FEATURES=1`
   - `ORCH_ASSUME_YES=1`
4. Verifies production `/catch-up/` HTML and versioned engine/app assets.
5. Writes `docs/CATCHUP_DEPLOY_REPORT_<UTC_TIMESTAMP>.md` with command evidence and log paths.

### Staging-Only Variant

```bash
CLOUDFLARE_API_TOKEN=... ./scripts/catchup-age-prod-orchestrator.sh --staging-only
```
