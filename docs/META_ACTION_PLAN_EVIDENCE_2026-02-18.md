# Meta Action Plan Evidence (2026-02-18)

## action-g-legal-001-strip-dob-date-fields-from-analytics-event
- Title: Strip DOB/date fields from analytics events and retain only coarse, non-identifying derived categories.
- Gates: G-LEGAL-001
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:7

## action-g-med-002-add-patient-age-input-evaluate-med-minage-
- Title: Add patient age input, evaluate med.minAge rules before output, and block/flag ineligible results.
- Gates: G-MED-002
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:9

## action-g-med-001-add-per-dose-date-capture-and-validation-p
- Title: Add per-dose date capture and validation pipeline before forecasting.
- Gates: G-MED-001
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:8

## action-g-cross-001-harmonize-legal-language-with-actual-produ
- Title: Harmonize legal language with actual product intent and schema declarations.
- Gates: G-CROSS-001
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:10

## action-g-med-004-persist-calculation-context-including-usef
- Title: Persist calculation context (including useFenton/fentonGaWeeks) and pass through tab redraw calls.
- Gates: G-MED-004
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:16

## action-g-med-006-either-implement-bmi-for-age-calculations-
- Title: Either implement BMI-for-age calculations and UI or remove BMI claims from metadata/content.
- Gates: G-MED-006
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:18

## action-g-legal-002-align-copy-and-policy-with-actual-behavior
- Title: Align copy and policy with actual behavior or disable tracking paths that contradict current statements.
- Gates: G-LEGAL-002
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:11

## action-g-legal-003-introduce-explicit-consent-state-gate-and-
- Title: Introduce explicit consent state gate and remove implicit hardcoded production measurement defaults.
- Gates: G-LEGAL-003
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:12

## action-g-legal-004-add-explicit-pre-init-dnt-gate-or-remove-c
- Title: Add explicit pre-init DNT gate or remove claims implying DNT-based suppression.
- Gates: G-LEGAL-004
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:13

## action-g-legal-005-move-geolocation-behind-first-party-endpoi
- Title: Move geolocation behind first-party endpoint or approved provider with explicit HTTPS and governance controls.
- Gates: G-LEGAL-005
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:14

## action-g-med-003-replace-hardcoded-thresholds-with-validate
- Title: Replace hardcoded thresholds with validated constants and add unit tests for boundary days.
- Gates: G-MED-003
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:15

## action-g-med-005-either-constrain-accepted-age-to-supported
- Title: Either constrain accepted age to supported data range or add explicitly validated extended curves.
- Gates: G-MED-005
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:17

## action-g-ops-001-use-explicit-project-separation-and-deploy
- Title: Use explicit project separation and deploy commands without mutable config swaps.
- Gates: G-OPS-001
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:19

## action-g-runtime-003-introduce-versioned-asset-strategy-before-
- Title: Introduce versioned asset strategy before retaining immutable 1y cache semantics.
- Gates: G-RUNTIME-003
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:20

## action-g-tech-001-synchronize-axis-bounds-with-validated-inp
- Title: Synchronize axis bounds with validated input limits and threshold data range.
- Gates: G-TECH-001
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:21

## action-g-tech-003-add-csp-and-hsts-directives-with-staged-ro
- Title: Add CSP and HSTS directives with staged rollout/testing to avoid breaking required assets.
- Gates: G-TECH-003
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:22

## action-g-tech-004-adopt-build-time-content-hashing-or-explic
- Title: Adopt build-time content hashing or explicit version query strategy and update cache policy accordingly.
- Gates: G-TECH-004
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:23

## action-g-content-001-generate-sitemap-and-metadata-timestamps-f
- Title: Generate sitemap and metadata timestamps from a single release pipeline source.
- Gates: G-CONTENT-001
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:24

## action-g-tech-005-generate-precache-manifest-during-build-or
- Title: Generate precache manifest during build or add automated cache-manifest consistency checks.
- Gates: G-TECH-005
- Sources:
  - docs/QA_GOD_FIX_QUEUE_2026-02-17.md:25

