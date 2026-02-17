# TinyHumanMD Comprehensive Website Review

Date: 2026-02-17
Scope: Full-site technical + legal + medical adversarial QA review
Method: Executor vs critic gates (22 total)
Result: 22/22 gates failed

## Critical Findings

1. `[Gate 01][Medical][Technical]` Catch-up logic cannot safely generate a true catch-up plan because it never captures prior dose dates, only checkbox counts. Claims of “personalized”/“next-due dates” are not supported by implementation.
   Evidence: `catch-up/index.html:8`, `catch-up/index.html:36`, `catch-up/index.html:59`, `catch-up/catch-up.js:321`, `catch-up/catch-up.js:403`

2. `[Gate 02][Legal][Medical]` Growth calculator transmits DOB and measurement date through analytics events (potential PHI/PII leakage risk).
   Evidence: `growth/growth.js:206`, `growth/growth.js:207`, `growth/growth.js:213`, `shared/analytics.js:412`, `shared/analytics.js:391`

3. `[Gate 03][Legal]` Multiple pages state “No tracking,” but analytics/fingerprinting/geolocation are active.
   Evidence: `growth/index.html:119`, `bili/index.html:90`, `catch-up/index.html:77`, `dosing/index.html:73`, `ga-calc/index.html:89`, `shared/analytics.js:41`, `shared/analytics.js:105`, `shared/analytics.js:188`, `shared/analytics.js:281`

4. `[Gate 04][Medical]` Dosing calculator ignores medication minimum-age restrictions (e.g., ibuprofen under 6 months, diphenhydramine under 2 years).
   Evidence: `data/dosing-reference.json:34`, `data/dosing-reference.json:174`, `dosing/index.html:42`, `dosing/dosing.js:43`

5. `[Gate 05][Medical]` GA term-status classification thresholds are incorrect vs standard obstetric definitions.
   Evidence: `ga-calc/ga-calc.js:124`

6. `[Gate 06][Medical][Technical]` Growth preterm/Fenton handling breaks on chart-tab clicks; re-calculation drops Fenton path and redraws with WHO/CDC logic.
   Evidence: `growth/growth.js:364`, `growth/growth.js:378`, `growth/growth.js:394`, `growth/growth.js:257`

## High Findings

7. `[Gate 07][Medical]` Bilirubin UI allows 0-168h but model effectively clamps to last threshold point (96h), so late-hour outputs are flat extrapolations.
   Evidence: `bili/index.html:57`, `bili/bili.js:29`, `bili/bili.js:30`, `data/bili-thresholds.json:10`

8. `[Gate 08][Medical][Technical]` Bilirubin chart hard-caps x-axis at 100h, clipping or misrepresenting inputs above 100h.
   Evidence: `bili/bili.js:171`

9. `[Gate 09][Technical]` `shared/analytics-config.js` is referenced across pages but missing in repo, causing runtime 404s in local/default builds.
   Evidence: `index.html:337`, `growth/index.html:174`, `bili/index.html:140`, `catch-up/index.html:123`, `dosing/index.html:119`, `ga-calc/index.html:133`, `.gitignore:4`

10. `[Gate 10][Legal][Technical]` Analytics starts automatically with no consent gate and a hardcoded GA fallback ID.
    Evidence: `shared/analytics.js:27`, `shared/analytics.js:555`, `shared/analytics.js:677`

11. `[Gate 11][Legal]` Code claims it “respects Do Not Track,” but there is no enforcement branch; DNT is only captured as metadata.
    Evidence: `shared/analytics.js:36`, `shared/analytics.js:56`

12. `[Gate 12][Technical][Legal]` Security headers are incomplete for healthcare-adjacent tooling (no CSP/HSTS in repo header policy).
    Evidence: `_headers:1`

13. `[Gate 13][Technical][Medical]` JS/CSS are cached as immutable for one year without filename hashing, increasing stale-medical-logic risk in clients.
    Evidence: `_headers:9`, `_headers:13`, `index.html:336`, `growth/index.html:177`

14. `[Gate 14][Technical]` Service worker uses a manual static asset list, increasing update drift and offline staleness risk.
    Evidence: `sw.js:2`, `sw.js:3`, `sw.js:41`

15. `[Gate 15][Ops]` Deploy config risk: `wrangler.toml` and `staging-wrangler.toml` point to the same project name; deploy script mutates config files in-place.
    Evidence: `wrangler.toml:1`, `staging-wrangler.toml:1`, `scripts/deploy.sh:21`, `scripts/deploy.sh:23`, `scripts/deploy.sh:34`

16. `[Gate 16][Technical QA]` No automated test/lint QA gate exists in scripts.
    Evidence: `package.json:5`, `package.json:6`

## Medium Findings

17. `[Gate 17][Medical][Product Integrity]` Growth page advertises BMI-for-age support, but no BMI input/calculation exists.
    Evidence: `growth/index.html:8`, `growth/index.html:13`, `growth/index.html:139`, `growth/index.html:63`, `growth/growth.js:57`

18. `[Gate 18][Medical Content]` HPV schedule presentation is internally inconsistent: notes say minimum age 9, schedule column “7-10 yrs” says “Can begin.”
    Evidence: `app.js:31`

19. `[Gate 19][Legal Positioning]` Legal pages say “not a medical tool / do not use in workflow” while homepage structured data markets to clinicians as a medical web app.
    Evidence: `terms/index.html:69`, `terms/index.html:103`, `index.html:325`

20. `[Gate 20][Content Governance]` Core metadata and sitemap remain pinned to 2025 values while legal pages were updated in 2026, indicating governance drift.
    Evidence: `index.html:6`, `index.html:325`, `sitemap.xml:8`, `sitemap.xml:15`, `sitemap.xml:22`

21. `[Gate 21][Legal][Reliability]` IP geolocation integration uses ip-api free endpoint path with SSL/usage-model constraints and non-commercial limits.
    Evidence: `shared/analytics.js:107`, `shared/analytics.js:109`

22. `[Gate 22][Medical Content Risk]` Mpox card asserts “No waning observed for 5+ years,” which is stronger than current CDC wording on duration certainty.
    Evidence: `app.js:349`

## Open Questions

1. Is `shared/analytics-config.js` intentionally injected only at deploy time and omitted from version control?
2. Is the product intended for commercial use? If yes, ip-api free-tier assumptions are high risk.
3. Should legal positioning stay “not a medical tool,” or be aligned with clinician-targeted product messaging?

## External Sources Checked

1. CDC child and adolescent schedule page (addendum/date context): https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html
2. CDC mpox vaccines page (duration wording context): https://www.cdc.gov/mpox/vaccines/index.html
3. ACOG term definitions context: https://www.acog.org/womens-health/faqs/when-pregnancy-goes-past-your-due-date
4. ip-api free endpoint and limitations: http://ip-api.com/docs/api%3Ajson and https://members.ip-api.com/faq
