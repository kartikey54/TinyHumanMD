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
