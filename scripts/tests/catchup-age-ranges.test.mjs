import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { computeCatchupPlan, calculateAgeDays } = require('../../catch-up/catch-up-engine.js');

const TODAY_ISO = '2026-02-18';
const MS_PER_DAY = 86400000;

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function inputForAgeDays(targetAgeDays) {
  let dob = new Date(new Date(`${TODAY_ISO}T00:00:00`).getTime() - (targetAgeDays * MS_PER_DAY));
  let dobISO = toISODate(dob);

  for (let i = 0; i < 4; i++) {
    const actualAge = calculateAgeDays(dobISO, TODAY_ISO);
    if (actualAge === targetAgeDays) {
      return { dobISO, todayISO: TODAY_ISO };
    }

    dob = new Date(`${dobISO}T00:00:00`);
    dob.setDate(dob.getDate() + (actualAge - targetAgeDays));
    dobISO = toISODate(dob);
  }

  const finalAge = calculateAgeDays(dobISO, TODAY_ISO);
  assert.equal(finalAge, targetAgeDays, `Could not derive exact date pair for age ${targetAgeDays}`);
  return { dobISO, todayISO: TODAY_ISO };
}

function runPlan(ageDays, receivedByVaccine = {}) {
  return computeCatchupPlan({
    ...inputForAgeDays(ageDays),
    receivedByVaccine
  });
}

function getEntry(result, vaccineId) {
  const entry = result.plan.find((item) => item.vaccine.id === vaccineId);
  assert.ok(entry, `Expected vaccine entry for ${vaccineId}`);
  return entry;
}

test('rotavirus age boundaries enforce start and final-dose limits', () => {
  const rvAt104 = getEntry(runPlan(104), 'rv');
  assert.notEqual(rvAt104.status, 'aged-out');

  const rvAt105 = getEntry(runPlan(105), 'rv');
  assert.equal(rvAt105.status, 'aged-out');
  assert.match(rvAt105.message, /Do not initiate the first dose of rotavirus vaccine/i);

  const rvAt244WithPriorDose = getEntry(runPlan(244, { rv: 1 }), 'rv');
  assert.notEqual(rvAt244WithPriorDose.status, 'aged-out');

  const rvAt245WithPriorDose = getEntry(runPlan(245, { rv: 1 }), 'rv');
  assert.equal(rvAt245WithPriorDose.status, 'aged-out');
  assert.match(rvAt245WithPriorDose.message, /8 months 0 days/i);
});

test('hib boundaries enforce >=15 month simplification and >=5 year aged-out', () => {
  const hibAt456 = getEntry(runPlan(456), 'hib');
  assert.equal(hibAt456.status, 'due');
  assert.equal(hibAt456.targetDoses, 1);
  assert.match(hibAt456.ruleNote || '', />=15 months/i);

  const hibAt1825 = getEntry(runPlan(1825), 'hib');
  assert.equal(hibAt1825.status, 'aged-out');
  assert.match(hibAt1825.message, /not recommended at age 5 years or older/i);
});

test('pcv boundaries enforce >=24 month simplification and >=5 year aged-out', () => {
  const pcvAt730 = getEntry(runPlan(730), 'pcv');
  assert.equal(pcvAt730.status, 'due');
  assert.equal(pcvAt730.targetDoses, 1);
  assert.match(pcvAt730.ruleNote || '', />=24 months/i);

  const pcvAt1825 = getEntry(runPlan(1825), 'pcv');
  assert.equal(pcvAt1825.status, 'aged-out');
  assert.match(pcvAt1825.message, /not recommended at age 5 years or older/i);
});

test('dtap to tdap boundary at >=7 years switches to tdap/td catch-up logic', () => {
  const resultNoPrior = runPlan(2557);

  const dtapAt7 = getEntry(resultNoPrior, 'dtap');
  assert.equal(dtapAt7.status, 'aged-out');
  assert.match(dtapAt7.message, /Use Tdap\/Td catch-up/i);

  const tdapAt7NoPrior = getEntry(resultNoPrior, 'tdap');
  assert.equal(tdapAt7NoPrior.status, 'due');
  assert.equal(tdapAt7NoPrior.targetDoses, 3);
  assert.match(tdapAt7NoPrior.ruleNote || '', /3-dose Tdap\/Td catch-up/i);

  const tdapAt7OnePrior = getEntry(runPlan(2557, { dtap: 1 }), 'tdap');
  assert.equal(tdapAt7OnePrior.status, 'due');
  assert.equal(tdapAt7OnePrior.targetDoses, 2);
});

test('ipv boundaries enforce >=4 year simplification and >18 year routine stop', () => {
  const ipvAt1461 = getEntry(runPlan(1461), 'ipv');
  assert.equal(ipvAt1461.status, 'due');
  assert.equal(ipvAt1461.targetDoses, 3);
  assert.match(ipvAt1461.ruleNote || '', /first IPV dose is at >=4 years/i);

  const ipvAt6574 = getEntry(runPlan(6574), 'ipv');
  assert.notEqual(ipvAt6574.status, 'aged-out');

  const ipvAt6575 = getEntry(runPlan(6575), 'ipv');
  assert.equal(ipvAt6575.status, 'aged-out');
  assert.match(ipvAt6575.message, /through age 18 years/i);
});

test('hpv boundaries enforce age 15 split and >26 routine-start stop', () => {
  const hpvAt5478 = getEntry(runPlan(5478), 'hpv');
  assert.equal(hpvAt5478.status, 'due');
  assert.equal(hpvAt5478.targetDoses, 2);
  assert.match(hpvAt5478.ruleNote || '', /start before 15 years/i);

  const hpvAt5479 = getEntry(runPlan(5479), 'hpv');
  assert.equal(hpvAt5479.status, 'due');
  assert.equal(hpvAt5479.targetDoses, 3);
  assert.match(hpvAt5479.ruleNote || '', /start at >=15 years/i);

  const hpvAt9498 = getEntry(runPlan(9498), 'hpv');
  assert.equal(hpvAt9498.status, 'aged-out');
  assert.match(hpvAt9498.message, /after age 26 years/i);

  const hpvAt9498WithPrior = getEntry(runPlan(9498, { hpv: 1 }), 'hpv');
  assert.equal(hpvAt9498WithPrior.status, 'due');
  assert.equal(hpvAt9498WithPrior.targetDoses, 3);
});

test('representative profile has deterministic status mix across due/complete/aged-out', () => {
  const result = runPlan(2557, {
    hepb: 3,
    rv: 1,
    dtap: 0,
    hib: 1,
    pcv: 0,
    ipv: 1,
    mmr: 2,
    var: 0,
    hepa: 0,
    menacwy: 0,
    tdap: 0,
    hpv: 0
  });

  const statusMix = result.plan.reduce((acc, entry) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {});

  assert.deepEqual(statusMix, {
    complete: 2,
    'aged-out': 4,
    due: 4
  });
});
