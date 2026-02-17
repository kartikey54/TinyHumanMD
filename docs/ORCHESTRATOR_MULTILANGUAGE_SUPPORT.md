# TinyHumanMD Multi-Language Orchestrator

Last updated: 2026-02-17

## Goal
Add high-quality multi-language support to TinyHumanMD without breaking medical accuracy, legal disclaimers, SEO, accessibility, analytics integrity, or offline behavior.

## Codebase Constraints
- Stack is static HTML/CSS/vanilla JS (no framework).
- Routes are file-based (`/`, `/catch-up/`, `/growth/`, `/bili/`, `/ga-calc/`, `/dosing/`, `/terms/`, `/privacy/`).
- Shared runtime lives in `shared/` (`nav.js`, `seo.js`, `analytics.js`, etc.).
- Home route uses `app.js` for most UI rendering and does not consume `shared/nav.js`.
- PWA cache is explicit in `sw.js`; new localized assets must be planned into cache strategy.
- Medical and legal copy must stay clinically and legally safe after translation.

## Mandatory Outcomes
- Internationalization architecture in place (language catalogs + runtime resolver + fallback).
- Locale switching UX available and persistent.
- All user-visible strings externalized from JS/HTML where feasible.
- Localized SEO metadata and structured data (`inLanguage`, localized titles/descriptions, `hreflang` strategy).
- No broken calculators and no clinical meaning drift.
- Full QA evidence with adversarial critic loops (minimum 20 rounds).

## Agent Topology
Use these agents in parallel where possible:

1. `Orchestrator`
- Owns sequencing, task routing, merge decisions, and gate enforcement.
- Rejects output that passes tests but fails medical/legal/SEO quality.

2. `Executor-Implementation`
- Implements i18n runtime, catalog wiring, page refactors, metadata localization, and tests.

3. `Critic-Technical`
- Attempts to break routing, key resolution, fallback logic, and runtime behavior.
- Focus: missing keys, stale hardcoded strings, broken selectors, perf regressions.

4. `Critic-Medical`
- Validates translated medical claims preserve source meaning and safety qualifiers.
- Blocks overstatement, guideline drift, and mistranslations of contraindications/schedules.

5. `Critic-Legal`
- Verifies disclaimer integrity, terms/privacy parity, and non-deceptive language.
- Blocks wording that changes legal interpretation.

6. `Critic-SEO-A11y`
- Validates `lang` attributes, `hreflang`, canonical strategy, metadata parity, JSON-LD language fields, keyboard/screen-reader behavior.

## Execution Phases
### Phase 0: Baseline and Scope Lock
- Freeze baseline from `aap` branch.
- Build route/string inventory:
  - `index.html`, `app.js`
  - `catch-up/index.html`, `catch-up/catch-up.js`
  - `growth/index.html`, `growth/growth.js`
  - `bili/index.html`, `bili/bili.js`
  - `ga-calc/index.html`, `ga-calc/ga-calc.js`
  - `dosing/index.html`, `dosing/dosing.js`
  - `terms/index.html`, `privacy/index.html`
  - `shared/nav.js`, `shared/seo.js`, `manifest.json`, `sw.js`, `sitemap.xml`
- Lock target locales (example: `es`, `fr`, `hi`).

Exit criteria:
- Signed inventory of translatable strings and non-translatable constants.

### Phase 1: i18n Core
- Create `shared/i18n.js`:
  - Locale detection priority: URL > stored preference > browser language > default (`en`).
  - Safe fallback to English for missing keys.
  - `t(key, params)` with interpolation.
  - `setLocale(locale)` updates document language and persistence.
- Create locale catalogs in `locales/<locale>/...json` with namespace split:
  - `common.json`, `nav.json`, `home.json`, `catchup.json`, `growth.json`, `bili.json`, `ga.json`, `dosing.json`, `legal.json`, `seo.json`.

Exit criteria:
- i18n runtime can resolve keys and fallback deterministically.

### Phase 2: Navigation and Shared UI
- Refactor `shared/nav.js` and `shared/seo.js` to pull labels and card copy from i18n catalogs.
- Add language switcher in shared nav and homepage nav flow.
- Ensure switcher is keyboard accessible and mobile compatible.

Exit criteria:
- Nav + shared related tools render localized text without regressions.

### Phase 3: Route-by-Route Localization
- Localize each route in strict order:
  1. `/` (`index.html`, `app.js`)
  2. `/catch-up/`
  3. `/growth/`
  4. `/bili/`
  5. `/ga-calc/`
  6. `/dosing/`
  7. `/terms/`, `/privacy/`
- Externalize all static labels/messages and JS-generated UI copy.
- Keep numeric logic and clinical thresholds unchanged unless explicitly required.

Exit criteria:
- No route has unresolved key placeholders or forced English-only text (except approved proper nouns/medical abbreviations).

### Phase 4: SEO, PWA, and Discovery
- Localize page titles, meta descriptions, OG/Twitter text, JSON-LD `inLanguage`.
- Implement locale-aware URL strategy and `hreflang`.
- Update `sitemap.xml` for locale variants.
- Update `manifest.json` and `sw.js` caching strategy for locale assets.

Exit criteria:
- Search metadata and structured data are locale-consistent and valid.

### Phase 5: Hardening and Release
- Run full regression checks for calculators and interactions.
- Produce release notes and locale coverage report.
- Staging deploy and cross-locale smoke test.

Exit criteria:
- All critics sign off; no open blocker.

## 20-Round Executor-vs-Critic Protocol
Run at least 20 rounds. Each round:

1. Executor submits a small, reviewable delta.
2. All critics attack the delta in parallel.
3. Orchestrator classifies findings:
   - `Blocker`: merge denied
   - `Major`: fix in next delta
   - `Minor`: backlog allowed
4. Executor patches and resubmits.
5. Round closes only when blocker count is zero.

Required distribution:
- Minimum 20 total rounds.
- At least 6 rounds must include `Critic-Medical`.
- At least 4 rounds must include `Critic-Legal`.
- At least 6 rounds must include `Critic-SEO-A11y`.

## Quality Gates
### Gate A: Translation Integrity
- No missing keys at runtime.
- No fallback loops.
- Interpolations resolve safely.

### Gate B: Clinical Safety
- No translation changes the intended medical recommendation.
- Dose, interval, contraindication, and risk language is semantically equivalent.
- Mandatory clinician review for high-risk strings (pregnancy, neonatal, immunization schedule rules).

### Gate C: Legal Safety
- Terms/privacy/disclaimer meaning unchanged across locales.
- “Informational only / not medical advice” remains explicit.

### Gate D: SEO and Structured Data
- Per-locale title/description parity.
- JSON-LD valid and language-specific.
- `hreflang` and canonical rules are coherent and non-conflicting.

### Gate E: Accessibility
- Screen-reader labels localized.
- Switcher focus order and keyboard controls valid.
- No locale introduces contrast or layout regressions.

### Gate F: Performance + Offline
- Locale payload sizes bounded.
- Service worker cache list handles locale assets correctly.
- Cold-load and offline behavior unchanged or improved.

## Non-Negotiable Guardrails
- Do not alter medical calculations while localizing UI copy.
- Do not remove or weaken disclaimers.
- Do not silently change analytics semantics; if locale fields are added, document and review.
- Do not ship partially translated critical clinical warnings.

## Definition of Done
- Multi-language works across all routes for agreed locales.
- Critics completed 20+ rounds and signed off with zero blockers.
- Staging deployed and validated in each locale.
- Final dossier includes:
  - locale coverage matrix
  - unresolved minor issues
  - diff summary by route
  - post-release monitoring checklist

## Copy/Paste Master Prompt for Your Orchestrator
Use this prompt directly:

```text
You are the orchestration lead for TinyHumanMD, a static pediatric clinical web app (HTML/CSS/vanilla JS) with routes:
/, /catch-up/, /growth/, /bili/, /ga-calc/, /dosing/, /terms/, /privacy/.

Objective:
Implement production-grade multi-language support for locales: {{LOCALES}}.

Critical constraints:
1) Medical safety first: no semantic drift in schedule, contraindications, dosing, pregnancy, bilirubin, or catch-up guidance.
2) Legal safety: disclaimers and terms/privacy meaning must stay intact across locales.
3) Technical reliability: no broken calculators, no missing keys, no offline regressions, no SEO regressions.
4) Use adversarial workflow: executor vs critics for at least 20 rounds.

Agent roles:
- Executor-Implementation: writes code and tests.
- Critic-Technical: finds runtime/fallback/perf defects.
- Critic-Medical: finds clinical meaning drift and safety risks.
- Critic-Legal: finds legal/disclaimer risks.
- Critic-SEO-A11y: finds metadata, structured-data, hreflang, accessibility defects.

Execution phases (must be completed in order):
Phase 0 Baseline + string inventory.
Phase 1 shared i18n runtime + catalogs.
Phase 2 shared nav + shared SEO localization.
Phase 3 route-by-route localization.
Phase 4 metadata/JSON-LD/hreflang/sitemap/PWA updates.
Phase 5 hardening, staging validation, release dossier.

Hard rules:
- Block merge on any blocker from any critic.
- Log each round with: changed files, failing checks, fixes, remaining risks.
- Minimum 20 rounds; no early stop.
- Final output must include:
  a) route-by-route completion status,
  b) medical/legal sign-off notes,
  c) remaining minor issues,
  d) staging URLs and validation evidence.

Deliverables:
- i18n architecture and catalog structure.
- Localized UI and metadata across all routes.
- SEO and structured-data language support.
- QA report from 20+ adversarial rounds.
```
