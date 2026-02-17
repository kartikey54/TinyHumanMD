# TinyHumanMD Orchestrator: 5-Language Rollout

Last updated: 2026-02-17

## Target Locales
1. Spanish: `es`
2. Hindi: `hi`
3. French: `fr`
4. Mandarin Chinese (Simplified): `zh-CN`
5. Russian: `ru`

Default locale remains `en`.

## Objective
Ship production-grade multilingual support for `es`, `hi`, `fr`, `zh-CN`, `ru` across all routes, while preserving medical/legal correctness and avoiding unnecessary offline bloat.

## Explicit Offline Policy (Not Full Offline-First)
Do not pre-cache every language pack.

### Tier A (offline-critical, pre-cache in `sw.js`)
- `shared/i18n.js`
- `locales/en.json` (baseline fallback)
- `locales/es.json` (if Spanish is business-priority and low risk/size)
- existing core route assets already in current SW

### Tier B (lazy, cache-on-demand)
- `locales/hi.json`, `locales/fr.json`, `locales/zh-CN.json`, `locales/ru.json`
- any large per-route locale shards, eg `locales/zh-CN.home.json`
- fetch strategy: `network-first` with cached fallback
- TTL policy recommended: 7 days

### Tier C (never pre-cache)
- translation QA artifacts
- glossary/debug files
- reviewer notes

Decision rule:
- If locale pack exceeds size budget or is non-default, load on demand.
- If user has explicitly selected a locale once, cache it for subsequent visits.

## Architecture Requirements
- Locale detection priority: URL `?lang` > stored preference > browser locale > `en`.
- Support aliases:
  - `zh` -> `zh-CN`
  - `es-*` -> `es`
  - `fr-*` -> `fr`
  - `hi-*` -> `hi`
  - `ru-*` -> `ru`
- Fallback chain:
  - `requested locale` -> `en` -> key literal
- Keep medical numeric logic untouched.
- Translate UI/metadata/legal copy only.

## Execution Topology
Agents:
1. `Orchestrator`
2. `Executor-Implementation`
3. `Critic-Technical`
4. `Critic-Medical`
5. `Critic-Legal`
6. `Critic-SEO-A11y`
7. `Critic-Performance`

## Required Phases
### Phase 0: Baseline + Glossary Lock
- Freeze base branch.
- Build bilingual/trilingual medical glossary from current English source.
- Mark non-translatable terms (vaccine names, abbreviations, units).

Exit:
- Signed glossary for all 5 locales.

### Phase 1: Runtime and Locale Model
- Extend i18n runtime for `es`, `hi`, `fr`, `zh-CN`, `ru`.
- Add alias normalization and locale code canonicalization.
- Add safe handling for missing locale file and partial catalogs.

Exit:
- Runtime resolves all locale codes and fallback paths deterministically.

### Phase 2: Catalog Strategy
- Split catalogs by namespace to control payload:
  - `common`, `nav`, `related`, `meta`, route namespaces (`home`, `catchup`, `growth`, `bili`, `ga`, `dosing`, `terms`, `privacy`).
- Keep per-locale payload budgets:
  - Initial render budget target: <= 35 KB gzip (locale + runtime overhead).

Exit:
- Catalogs present for all 5 locales with key parity report.

### Phase 3: Route Localization
- Localize all routes:
  - `/`
  - `/catch-up/`
  - `/growth/`
  - `/bili/`
  - `/ga-calc/`
  - `/dosing/`
  - `/terms/`
  - `/privacy/`
- Keep calculators behavior unchanged.

Exit:
- No unresolved key labels on any route.

### Phase 4: SEO and Structured Data
- Localize metadata fields and social cards.
- Add `hreflang` entries for `en`, `es`, `hi`, `fr`, `zh-CN`, `ru`, `x-default`.
- Ensure JSON-LD `inLanguage` updates correctly per locale.

Exit:
- Metadata and structured-data checks pass for all locales.

### Phase 5: Caching and Perf Hardening
- Implement Tier A/B/C cache policy.
- Ensure lazy locale fetch does not block first meaningful render.
- Add fallback UI if locale fetch fails.

Exit:
- Performance critic signs off and offline behavior is acceptable for default/used locales.

## Adversarial QA Protocol
Minimum 25 rounds (higher than standard due 5-language scope).

Per round:
1. Executor submits delta.
2. Critics attack in parallel.
3. Orchestrator classifies findings (`Blocker`, `Major`, `Minor`).
4. Blockers must be fixed before next merge.

Coverage minimums:
- Medical critic in >= 8 rounds
- Legal critic in >= 6 rounds
- SEO/A11y critic in >= 8 rounds
- Performance critic in >= 6 rounds

## Hard Blockers
- Any translation that changes medical meaning.
- Any legal disclaimer weakening.
- Missing fallback causing blank or broken UI.
- Incorrect `hreflang` or canonical collisions.
- Locale switcher inaccessible via keyboard.
- Locale bundle strategy violating cache policy (pre-caching all heavy bundles).

## Deliverables
- i18n runtime supporting 6 active locales (`en` + 5 targets).
- Locale catalog parity report.
- Cache policy implementation report (what is pre-cached vs lazy).
- QA matrix with 25+ adversarial rounds and final blocker count = 0.
- Staging validation URLs for each locale.

## Copy/Paste Master Prompt
```text
You are the orchestration lead for TinyHumanMD (static HTML/CSS/vanilla JS).

Goal:
Implement multilingual support for:
- es (Spanish)
- hi (Hindi)
- fr (French)
- zh-CN (Mandarin Chinese, Simplified)
- ru (Russian)

Critical instruction:
Do NOT make everything offline-first.
Use a tiered caching strategy:
- Pre-cache only runtime + default fallback locale assets.
- Lazy-load and cache heavy locale packs on demand.

Routes in scope:
/, /catch-up/, /growth/, /bili/, /ga-calc/, /dosing/, /terms/, /privacy/

Non-negotiables:
1) Medical safety first: no semantic drift in clinical guidance.
2) Legal parity: disclaimers and legal meaning must remain intact.
3) No calculator logic changes.
4) SEO + structured-data localization must remain valid.
5) Keyboard-accessible language switcher required.

Agent roles:
- Executor-Implementation
- Critic-Technical
- Critic-Medical
- Critic-Legal
- Critic-SEO-A11y
- Critic-Performance

Phases:
0) Baseline + glossary lock
1) i18n runtime + locale normalization
2) namespace catalog rollout
3) route localization
4) SEO/hreflang/JSON-LD
5) caching/perf hardening and staging validation

QA protocol:
- Run at least 25 executor-vs-critic rounds.
- No blocker can remain open.
- Provide per-round logs of failures and fixes.

Output required:
- changed files list
- locale coverage matrix
- cache policy summary (pre-cache vs lazy)
- blocker/major/minor counts
- staging URLs for en/es/hi/fr/zh-CN/ru
```
