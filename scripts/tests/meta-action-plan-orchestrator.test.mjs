import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  parseQaFixQueue,
  parseWebsiteReview,
  parseGtmPlan,
  runMetaActionPlan
} from '../meta-action-plan-orchestrator.mjs';

const REPO_ROOT = process.cwd();
const FIXTURE_DIR = path.join(REPO_ROOT, 'scripts/tests/meta-plan/fixtures');

const FIXTURE_CONTEXT_FILES = [
  'scripts/tests/meta-plan/fixtures/QA_GOD_FIX_QUEUE_fixture.md',
  'scripts/tests/meta-plan/fixtures/WEBSITE_REVIEW_fixture.md',
  'scripts/tests/meta-plan/fixtures/PEDS_GTM_PLAN_fixture.md'
];

test('parseQaFixQueue extracts structured rows', async () => {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path.join(FIXTURE_DIR, 'QA_GOD_FIX_QUEUE_fixture.md'), 'utf8');

  const rows = parseQaFixQueue(content, 'fixtures/QA_GOD_FIX_QUEUE_fixture.md');
  assert.equal(rows.length, 3);
  assert.equal(rows[0].gate_id, 'G-LEGAL-001');
  assert.equal(rows[0].severity, 'blocker');
  assert.equal(rows[0].owner, 'analytics');
  assert.equal(rows[1].gate_id, 'G-MED-001');
  assert.match(rows[1].title, /per-dose date capture/i);
});

test('parseWebsiteReview maps section severity and captures evidence refs', async () => {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path.join(FIXTURE_DIR, 'WEBSITE_REVIEW_fixture.md'), 'utf8');

  const findings = parseWebsiteReview(content, 'fixtures/WEBSITE_REVIEW_fixture.md');
  assert.equal(findings.length, 3);
  assert.equal(findings[0].severity, 'blocker');
  assert.equal(findings[2].severity, 'major');
  assert.equal(findings[0].gate_id, 'Gate 01');
  assert.ok(findings[0].evidence_refs.length >= 2);
});

test('parseGtmPlan extracts phrases and keyword signals', async () => {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(path.join(FIXTURE_DIR, 'PEDS_GTM_PLAN_fixture.md'), 'utf8');

  const gtm = parseGtmPlan(content);
  assert.ok(gtm.phrases.length >= 2);
  assert.ok(gtm.keywords.includes('dosing'));
  assert.ok(gtm.keywords.includes('growth'));
});

test('runMetaActionPlan supports custom context override and optional missing files', async () => {
  const result = await runMetaActionPlan({
    repoRoot: REPO_ROOT,
    contextFiles: FIXTURE_CONTEXT_FILES,
    optionalContextFiles: ['scripts/tests/meta-plan/fixtures/DOES_NOT_EXIST.md'],
    includeOptional: true,
    strict: true,
    rounds: 8,
    outDate: '2026-02-18',
    writeOutputs: false
  });

  assert.ok(result.actions.length >= 3);
  assert.ok(result.waves.length === 4);

  const missingOptional = result.sources.find((s) => s.path.includes('DOES_NOT_EXIST.md'));
  assert.ok(missingOptional);
  assert.equal(missingOptional.required, false);
  assert.equal(missingOptional.exists, false);

  const top = result.actions[0];
  assert.ok(top.action_id.startsWith('action-'));
  assert.ok(['wave_0', 'wave_1', 'wave_2', 'wave_3'].includes(top.wave));
});

test('runMetaActionPlan strict mode fails on missing required context', async () => {
  await assert.rejects(
    () => runMetaActionPlan({
      repoRoot: REPO_ROOT,
      contextFiles: ['docs/DOES_NOT_EXIST.md'],
      strict: true,
      writeOutputs: false
    }),
    /Missing required context files/
  );
});

test('golden snapshot for canonical docs top 10 action ids and waves', async () => {
  const result = await runMetaActionPlan({
    repoRoot: REPO_ROOT,
    strict: true,
    rounds: 20,
    outDate: '2026-02-18',
    writeOutputs: false
  });

  const top10 = result.actions.slice(0, 10).map((a) => `${a.action_id}|${a.wave}`);

  assert.deepEqual(top10, [
    'action-g-legal-001-strip-dob-date-fields-from-analytics-event|wave_0',
    'action-g-med-002-add-patient-age-input-evaluate-med-minage-|wave_0',
    'action-g-med-001-add-per-dose-date-capture-and-validation-p|wave_0',
    'action-g-cross-001-harmonize-legal-language-with-actual-produ|wave_1',
    'action-g-med-004-persist-calculation-context-including-usef|wave_2',
    'action-g-med-006-either-implement-bmi-for-age-calculations-|wave_1',
    'action-g-legal-002-align-copy-and-policy-with-actual-behavior|wave_1',
    'action-g-legal-003-introduce-explicit-consent-state-gate-and-|wave_1',
    'action-g-legal-004-add-explicit-pre-init-dnt-gate-or-remove-c|wave_1',
    'action-g-legal-005-move-geolocation-behind-first-party-endpoi|wave_1'
  ]);
});
