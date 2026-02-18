# Meta Action Plan Waves (2026-02-18)

## WAVE_0

- Goal: Blocker risk containment and release-safety preconditions
- Entry criteria: Backlog normalized; Blocker actions identified
- Exit criteria: All blocker acceptance criteria passed; No unresolved blocker dependencies
- Owner load:
  - analytics: 1
  - logic: 2

### Items

1. action-g-legal-001-strip-dob-date-fields-from-analytics-event
   - Strip DOB/date fields from analytics events and retain only coarse, non-identifying derived categories.
   - severity: blocker; score: 85; owner: analytics
   - acceptance: Potentially identifying/date-sensitive clinical inputs should be excluded or strongly minimized from analytics payloads.
2. action-g-med-002-add-patient-age-input-evaluate-med-minage-
   - Add patient age input, evaluate med.minAge rules before output, and block/flag ineligible results.
   - severity: blocker; score: 80; owner: logic
   - acceptance: Medication outputs with age restrictions should require age input and enforce hard-stop/guardrails.
3. action-g-med-001-add-per-dose-date-capture-and-validation-p
   - Add per-dose date capture and validation pipeline before forecasting.
   - severity: blocker; score: 70; owner: logic
   - acceptance: Catch-up planning should capture date-aware prior dose validity when claiming interval-sensitive planning.

## WAVE_1

- Goal: Major medical/legal correctness and contradiction removal
- Entry criteria: Wave 0 complete or explicitly waived
- Exit criteria: Major medical/legal actions meet acceptance criteria
- Owner load:
  - content: 1
  - legal: 4
  - logic: 1
  - ops: 2

### Items

1. action-g-cross-001-harmonize-legal-language-with-actual-produ
   - Harmonize legal language with actual product intent and schema declarations.
   - severity: major; score: 50; owner: legal
   - acceptance: Legal, product, and structured-data positioning should be coherent and non-contradictory.
2. action-g-med-006-either-implement-bmi-for-age-calculations-
   - Either implement BMI-for-age calculations and UI or remove BMI claims from metadata/content.
   - severity: major; score: 50; owner: content
   - acceptance: Public capability statements should match implemented calculator behavior.
3. action-g-legal-002-align-copy-and-policy-with-actual-behavior
   - Align copy and policy with actual behavior or disable tracking paths that contradict current statements.
   - severity: major; score: 40; owner: legal
   - acceptance: Public privacy claims should accurately reflect active telemetry behavior.
4. action-g-legal-003-introduce-explicit-consent-state-gate-and-
   - Introduce explicit consent state gate and remove implicit hardcoded production measurement defaults.
   - severity: major; score: 40; owner: legal
   - acceptance: Consent-sensitive tracking should be gated and fallback IDs should not silently activate in production paths.
5. action-g-legal-004-add-explicit-pre-init-dnt-gate-or-remove-c
   - Add explicit pre-init DNT gate or remove claims implying DNT-based suppression.
   - severity: major; score: 40; owner: legal
   - acceptance: If DNT is represented as respected behavior, analytics init should branch accordingly.
6. action-g-legal-005-move-geolocation-behind-first-party-endpoi
   - Move geolocation behind first-party endpoint or approved provider with explicit HTTPS and governance controls.
   - severity: major; score: 40; owner: ops
   - acceptance: Production telemetry should use secure, policy-approved geolocation providers and explicit contractual limits.
7. action-g-med-003-replace-hardcoded-thresholds-with-validate
   - Replace hardcoded thresholds with validated constants and add unit tests for boundary days.
   - severity: major; score: 40; owner: logic
   - acceptance: Term classifications should map accurately to accepted gestational age bins.
8. action-g-tech-004-adopt-build-time-content-hashing-or-explic
   - Adopt build-time content hashing or explicit version query strategy and update cache policy accordingly.
   - severity: major; score: 40; owner: ops
   - acceptance: Immutable caching should be paired with hashed or versioned asset paths.

## WAVE_2

- Goal: Remaining major technical/ops hardening
- Entry criteria: Wave 1 complete
- Exit criteria: Infrastructure and runtime major gates satisfied
- Owner load:
  - frontend: 1
  - logic: 2
  - ops: 3

### Items

1. action-g-med-004-persist-calculation-context-including-usef
   - Persist calculation context (including useFenton/fentonGaWeeks) and pass through tab redraw calls.
   - severity: major; score: 50; owner: logic
   - acceptance: Preterm/Fenton mode should persist across tab interactions.
2. action-g-med-005-either-constrain-accepted-age-to-supported
   - Either constrain accepted age to supported data range or add explicitly validated extended curves.
   - severity: major; score: 40; owner: logic
   - acceptance: Input range and modeled threshold domain should remain aligned or explicitly flagged as extrapolation.
3. action-g-ops-001-use-explicit-project-separation-and-deploy
   - Use explicit project separation and deploy commands without mutable config swaps.
   - severity: major; score: 40; owner: ops
   - acceptance: Environment configs should clearly separate targets and avoid mutable swap-side effects.
4. action-g-runtime-003-introduce-versioned-asset-strategy-before-
   - Introduce versioned asset strategy before retaining immutable 1y cache semantics.
   - severity: major; score: 40; owner: ops
   - acceptance: Immutable caching should accompany content-hashed/versioned asset paths.
5. action-g-tech-001-synchronize-axis-bounds-with-validated-inp
   - Synchronize axis bounds with validated input limits and threshold data range.
   - severity: major; score: 40; owner: frontend
   - acceptance: Visualization domain should cover accepted input domain or enforce stricter input limits.
6. action-g-tech-003-add-csp-and-hsts-directives-with-staged-ro
   - Add CSP and HSTS directives with staged rollout/testing to avoid breaking required assets.
   - severity: major; score: 40; owner: ops
   - acceptance: Production header baseline should include CSP and HSTS (where deployment supports HTTPS-only).

## WAVE_3

- Goal: Minor governance, SEO, and process stabilization
- Entry criteria: Major waves complete
- Exit criteria: Minor actions triaged and scheduled with owners
- Owner load:
  - ops: 1
  - seo: 1

### Items

1. action-g-content-001-generate-sitemap-and-metadata-timestamps-f
   - Generate sitemap and metadata timestamps from a single release pipeline source.
   - severity: minor; score: 20; owner: seo
   - acceptance: Sitemap/page metadata should reflect a consistent release-date governance process.
2. action-g-tech-005-generate-precache-manifest-during-build-or
   - Generate precache manifest during build or add automated cache-manifest consistency checks.
   - severity: minor; score: 20; owner: ops
   - acceptance: Critical cache manifests should be generated or validated automatically.

