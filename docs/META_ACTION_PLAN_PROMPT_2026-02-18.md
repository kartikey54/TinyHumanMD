# Meta Action Plan Implementation Prompt (2026-02-18)

You are implementing TinyHumanMD remediation and growth work from a normalized action backlog.

## Guardrails
- Execute wave-by-wave in order (wave_0 -> wave_3).
- Do not mutate outside the current wave scope unless resolving explicit dependencies.
- Keep medical/legal claims aligned with actual runtime behavior.
- For each action: implement code changes, tests, and acceptance evidence.

## Required Pre-Merge Gates
- Relevant unit/integration tests pass.
- No blocker action is left partially implemented.
- Release notes include changed claims, risk, and rollback notes.

## WAVE_0 Execution
Goal: Blocker risk containment and release-safety preconditions
Actions:
- action-g-legal-001-strip-dob-date-fields-from-analytics-event: Strip DOB/date fields from analytics events and retain only coarse, non-identifying derived categories.
- action-g-med-002-add-patient-age-input-evaluate-med-minage-: Add patient age input, evaluate med.minAge rules before output, and block/flag ineligible results.
- action-g-med-001-add-per-dose-date-capture-and-validation-p: Add per-dose date capture and validation pipeline before forecasting.

## WAVE_1 Execution
Goal: Major medical/legal correctness and contradiction removal
Actions:
- action-g-cross-001-harmonize-legal-language-with-actual-produ: Harmonize legal language with actual product intent and schema declarations.
- action-g-med-006-either-implement-bmi-for-age-calculations-: Either implement BMI-for-age calculations and UI or remove BMI claims from metadata/content.
- action-g-legal-002-align-copy-and-policy-with-actual-behavior: Align copy and policy with actual behavior or disable tracking paths that contradict current statements.
- action-g-legal-003-introduce-explicit-consent-state-gate-and-: Introduce explicit consent state gate and remove implicit hardcoded production measurement defaults.
- action-g-legal-004-add-explicit-pre-init-dnt-gate-or-remove-c: Add explicit pre-init DNT gate or remove claims implying DNT-based suppression.
- action-g-legal-005-move-geolocation-behind-first-party-endpoi: Move geolocation behind first-party endpoint or approved provider with explicit HTTPS and governance controls.
- action-g-med-003-replace-hardcoded-thresholds-with-validate: Replace hardcoded thresholds with validated constants and add unit tests for boundary days.
- action-g-tech-004-adopt-build-time-content-hashing-or-explic: Adopt build-time content hashing or explicit version query strategy and update cache policy accordingly.

## WAVE_2 Execution
Goal: Remaining major technical/ops hardening
Actions:
- action-g-med-004-persist-calculation-context-including-usef: Persist calculation context (including useFenton/fentonGaWeeks) and pass through tab redraw calls.
- action-g-med-005-either-constrain-accepted-age-to-supported: Either constrain accepted age to supported data range or add explicitly validated extended curves.
- action-g-ops-001-use-explicit-project-separation-and-deploy: Use explicit project separation and deploy commands without mutable config swaps.
- action-g-runtime-003-introduce-versioned-asset-strategy-before-: Introduce versioned asset strategy before retaining immutable 1y cache semantics.
- action-g-tech-001-synchronize-axis-bounds-with-validated-inp: Synchronize axis bounds with validated input limits and threshold data range.
- action-g-tech-003-add-csp-and-hsts-directives-with-staged-ro: Add CSP and HSTS directives with staged rollout/testing to avoid breaking required assets.

## WAVE_3 Execution
Goal: Minor governance, SEO, and process stabilization
Actions:
- action-g-content-001-generate-sitemap-and-metadata-timestamps-f: Generate sitemap and metadata timestamps from a single release pipeline source.
- action-g-tech-005-generate-precache-manifest-during-build-or: Generate precache manifest during build or add automated cache-manifest consistency checks.

