# Meta Action Plan Report (2026-02-18)

## Source Coverage

- docs/QA_GOD_FIX_QUEUE_2026-02-17.md (required): loaded
- docs/WEBSITE_REVIEW_2026-02-17.md (required): loaded
- docs/PEDS_GTM_PLAN_2026-02-17.md (required): loaded

## Parse Warnings

- none

## Priority Distribution

- Blocker: 3
- Major: 14
- Minor: 2
- Wave 0: 3
- Wave 1: 8
- Wave 2: 6
- Wave 3: 2

## Top 10 Actions

1. action-g-legal-001-strip-dob-date-fields-from-analytics-event
   - title: Strip DOB/date fields from analytics events and retain only coarse, non-identifying derived categories.
   - owner: analytics | wave: wave_0 | score: 85
   - rationale: severity=blocker; gtm=medium; domains=legal/medical; refs=1
2. action-g-med-002-add-patient-age-input-evaluate-med-minage-
   - title: Add patient age input, evaluate med.minAge rules before output, and block/flag ineligible results.
   - owner: logic | wave: wave_0 | score: 80
   - rationale: severity=blocker; gtm=high; domains=none; refs=1
3. action-g-med-001-add-per-dose-date-capture-and-validation-p
   - title: Add per-dose date capture and validation pipeline before forecasting.
   - owner: logic | wave: wave_0 | score: 70
   - rationale: severity=blocker; gtm=low; domains=medical/ops; refs=1
4. action-g-cross-001-harmonize-legal-language-with-actual-produ
   - title: Harmonize legal language with actual product intent and schema declarations.
   - owner: legal | wave: wave_1 | score: 50
   - rationale: severity=major; gtm=high; domains=legal/product/technical; refs=1
5. action-g-med-004-persist-calculation-context-including-usef
   - title: Persist calculation context (including useFenton/fentonGaWeeks) and pass through tab redraw calls.
   - owner: logic | wave: wave_2 | score: 50
   - rationale: severity=major; gtm=high; domains=none; refs=1
6. action-g-med-006-either-implement-bmi-for-age-calculations-
   - title: Either implement BMI-for-age calculations and UI or remove BMI claims from metadata/content.
   - owner: content | wave: wave_1 | score: 50
   - rationale: severity=major; gtm=high; domains=legal/product; refs=1
7. action-g-legal-002-align-copy-and-policy-with-actual-behavior
   - title: Align copy and policy with actual behavior or disable tracking paths that contradict current statements.
   - owner: legal | wave: wave_1 | score: 40
   - rationale: severity=major; gtm=low; domains=legal; refs=1
8. action-g-legal-003-introduce-explicit-consent-state-gate-and-
   - title: Introduce explicit consent state gate and remove implicit hardcoded production measurement defaults.
   - owner: legal | wave: wave_1 | score: 40
   - rationale: severity=major; gtm=medium; domains=legal/product/technical; refs=1
9. action-g-legal-004-add-explicit-pre-init-dnt-gate-or-remove-c
   - title: Add explicit pre-init DNT gate or remove claims implying DNT-based suppression.
   - owner: legal | wave: wave_1 | score: 40
   - rationale: severity=major; gtm=low; domains=legal; refs=1
10. action-g-legal-005-move-geolocation-behind-first-party-endpoi
   - title: Move geolocation behind first-party endpoint or approved provider with explicit HTTPS and governance controls.
   - owner: ops | wave: wave_1 | score: 40
   - rationale: severity=major; gtm=medium; domains=legal/ops/product; refs=1

## Dependency Graph Summary

- total actions: 19
- total dependency edges: 65
- action-g-legal-004-add-explicit-pre-init-dnt-gate-or-remove-c: 13 dependencies
- action-g-legal-002-align-copy-and-policy-with-actual-behavior: 12 dependencies
- action-g-cross-001-harmonize-legal-language-with-actual-produ: 10 dependencies
- action-g-med-006-either-implement-bmi-for-age-calculations-: 10 dependencies
- action-g-content-001-generate-sitemap-and-metadata-timestamps-f: 9 dependencies
- action-g-legal-001-strip-dob-date-fields-from-analytics-event: 4 dependencies
- action-g-legal-005-move-geolocation-behind-first-party-endpoi: 4 dependencies
- action-g-legal-003-introduce-explicit-consent-state-gate-and-: 3 dependencies
- action-g-med-001-add-per-dose-date-capture-and-validation-p: 0 dependencies
- action-g-med-002-add-patient-age-input-evaluate-med-minage-: 0 dependencies

## Wave Plan

- wave_0: Blocker risk containment and release-safety preconditions (3 items)
- wave_1: Major medical/legal correctness and contradiction removal (8 items)
- wave_2: Remaining major technical/ops hardening (6 items)
- wave_3: Minor governance, SEO, and process stabilization (2 items)
