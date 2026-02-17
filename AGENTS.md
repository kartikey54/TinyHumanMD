## Codex Rules

- Treat this repository as a static, client-side web app deployed on Cloudflare Pages.
- Keep changes framework-free unless explicitly requested; the stack is HTML/CSS/vanilla JavaScript.
- Keep calculator logic and clinical reference data aligned when updating behavior.
- Preserve shared runtime conventions in `shared/` (`nav.js`, `analytics.js`, `seo.js`, `lms.js`, `chart-helpers.js`, `storage.js`).
- For detailed architecture and module navigation, use `docs/CODEBASE_MAP.md`.
- Commit and push to remote regularly after meaningful checkpoints; when a user asks to commit, include a push in the same workflow.

## Codebase Overview

TinyHumanMD is a static, client-side pediatric toolkit deployed on Cloudflare Pages. It combines a homepage immunization schedule (`index.html` + `app.js`) with dedicated calculators for catch-up vaccines, growth percentiles, bilirubin thresholds, gestational age, and weight-based dosing.

**Stack**: Static HTML/CSS/JavaScript, JSON clinical reference files, Chart.js (CDN), IndexedDB for local persistence, Cloudflare Pages/Wrangler deployment.
**Structure**: Tool pages live in top-level feature directories (`catch-up/`, `growth/`, `bili/`, `ga-calc/`, `dosing/`), shared runtime lives in `shared/`, and data tables live in `data/`.
