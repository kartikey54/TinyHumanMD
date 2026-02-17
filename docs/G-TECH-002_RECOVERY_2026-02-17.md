# G-TECH-002 Recovery Record

Date: 2026-02-17  
Branch: `aap`  
Gate: `G-TECH-002` (`shared/analytics-config.js is referenced but absent from repository`)

## Objective

Restore `shared/analytics-config.js` without changing analytics runtime logic in `shared/analytics.js`.

## Investigation Summary

1. Confirmed all major routes reference `shared/analytics-config.js` before `shared/analytics.js`.
2. Confirmed file was absent from repository and explicitly excluded in `.gitignore`.
3. Traced history:
   - `956a3b1` (2026-02-08): moved runtime tokens into `shared/analytics-config.js` loader model.
   - `042e86b` (2026-02-08): `.gitignore` contains `shared/analytics-config.js`, enabling silent omission from source control.
   - `928db09` (2026-02-08): contains known production analytics IDs in prior `shared/analytics.js`.
4. Confirmed deployed `https://tinyhumanmd.com/shared/analytics-config.js` and `https://staging.tinyhumanmd.pages.dev/shared/analytics-config.js` currently return `text/html` (SPA fallback), not JS config content.
5. Confirmed `shared/analytics.js` hash parity across local/staging/production:
   - `8f3552a90945ccfd8445f57d0c19c7af977251a40f39af2a2f8322853ea21b91`

## Changes Applied

1. Removed ignore rule for `shared/analytics-config.js` from `.gitignore`.
2. Added tracked file `shared/analytics-config.js` with historically-known analytics values and safe default merge behavior:
   - `gaId`: `G-FMNPFLW6LD`
   - `cfBeaconToken`: `ORoKf_LNQXvvbwAbBeUKkfuweRRmGYblp-qmAjgI`
   - `clarityProject`: empty
   - `ipApiKey`: empty
   - `posthogKey`: empty
   - `posthogHost`: `https://app.posthog.com`
3. Did not modify `shared/analytics.js` logic or event payload behavior.

## Verification

1. Syntax check passed:
   - `node --check shared/analytics-config.js`
2. QA orchestration rerun:
   - `npm run qa:god`
   - Updated summary: Blocker `3`, Major `14`, Minor `2`
   - `G-TECH-002` no longer present in `docs/QA_GOD_GATE_MATRIX_2026-02-17.json`
3. Fix queue no longer lists `G-TECH-002` in `docs/QA_GOD_FIX_QUEUE_2026-02-17.md`.

## Notes

- This recovery keeps analytics behavior aligned with previously known production IDs and removes a silent config drift path.
- If Clarity/PostHog keys are intended to be active, populate those keys in `shared/analytics-config.js` through controlled configuration management.
