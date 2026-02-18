/* ================================================================
   TinyHumanMD | Catch-Up Immunization Engine
   Pure logic for planning and age-boundary rules
   ================================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.TinyCatchupEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MS_PER_DAY = 86400000;

  var AGE_15_MO = 456;
  var AGE_24_MO = 730;
  var AGE_4_YR = 1461;
  var AGE_7_YR = 2557;
  var AGE_13_YR = 4748;
  var AGE_15_YR = 5479;
  var AGE_18_YR = 6574;
  var AGE_26_YR = 9497;

  var SERIES = [
    {
      id: 'hepb', name: 'Hepatitis B', abbr: 'HepB', totalDoses: 3,
      minAge: [0, 28, 168],
      minInterval: [28, 56],
      recAge: [0, 30, 180],
      notes: 'Min age for dose 3: 24 weeks. Min interval dose 1->3: 16 weeks.',
      intervalHint: 'Minimum 4 weeks between dose 1->2; final dose constraints apply.',
      caveats: [
        'Standard series is 3 doses; final dose at <strong>&ge;24 weeks</strong>.',
        'Adolescents <strong>&ge;11 years</strong> may use 2-dose adult formulation (0, 6 months).'
      ]
    },
    {
      id: 'rv', name: 'Rotavirus', abbr: 'RV', totalDoses: 3,
      minAge: [42, 70, 98],
      minInterval: [28, 28],
      recAge: [60, 120, 180],
      maxAge: 244,
      maxFirstDose: 104,
      notes: 'Max age for dose 1: 14 weeks 6 days. Do not initiate the first dose of rotavirus vaccine at >=15 weeks of age due to increased risk of intussusception. Max age for final dose: 8 months 0 days.',
      intervalHint: 'Minimum 4 weeks between doses. First dose before 15 weeks; final dose by 8 months 0 days.',
      caveats: [
        'Do NOT initiate first dose at <strong>&ge;15 weeks</strong> (intussusception risk).',
        'Maximum age for final dose: <strong>8 months 0 days</strong>.'
      ]
    },
    {
      id: 'dtap', name: 'DTaP', abbr: 'DTaP', totalDoses: 5,
      minAge: [42, 70, 98, 365, 1461],
      minInterval: [28, 28, 180, 180],
      recAge: [60, 120, 180, 455, 1461],
      notes: '5th dose not needed if 4th given at age >= 4 years.',
      intervalHint: 'Minimum 4 weeks between doses 1->3; minimum 6 months before doses 4 and 5.',
      caveats: [
        'If Dose 4 at <strong>&ge;4 years</strong> and <strong>&ge;6 months</strong> after Dose 3, Dose 5 NOT needed.',
        'If first tetanus dose at <strong>&ge;7 years</strong>, switch to Tdap/Td catch-up.'
      ]
    },
    {
      id: 'hib', name: 'Hib', abbr: 'Hib', totalDoses: 4,
      minAge: [42, 70, 98, 365],
      minInterval: [28, 28, 56],
      recAge: [60, 120, 180, 395],
      maxCatchupAge: 1825,
      maxCatchupMessage: 'Routine Hib catch-up is not recommended at age 5 years or older unless high-risk.',
      notes: 'Dose count depends on vaccine type. If PRP-OMP: 2 primary doses + booster.',
      intervalHint: 'Minimum 4 weeks between early doses; later intervals depend on age and product.',
      caveats: [
        'Any Hib dose at <strong>&ge;15 months</strong> (healthy child) completes series.',
        'Routine Hib generally not recommended after <strong>5 years</strong> unless high-risk.'
      ]
    },
    {
      id: 'pcv', name: 'Pneumococcal (PCV)', abbr: 'PCV', totalDoses: 4,
      minAge: [42, 70, 98, 365],
      minInterval: [28, 28, 56],
      recAge: [60, 120, 180, 395],
      maxCatchupAge: 1825,
      maxCatchupMessage: 'Routine PCV catch-up is generally not recommended at age 5 years or older unless high-risk.',
      notes: 'Additional doses for high-risk children.',
      intervalHint: 'Minimum 4 weeks between early doses; final interval often 8 weeks.',
      caveats: [
        'Healthy child with PCV dose at <strong>&ge;24 months</strong> is generally complete.',
        'Routine catch-up generally ends before <strong>5 years</strong>; high-risk schedule differs.'
      ]
    },
    {
      id: 'ipv', name: 'Polio (IPV)', abbr: 'IPV', totalDoses: 4,
      minAge: [42, 70, 98, 1461],
      minInterval: [28, 28, 180],
      recAge: [60, 120, 365, 1461],
      notes: 'Final dose on or after 4th birthday and >= 6 months after previous dose.',
      intervalHint: 'Minimum 4 weeks between early doses; final dose must be at least 6 months after prior dose.',
      caveats: [
        'If Dose 3 at <strong>&ge;4 years</strong> and <strong>&ge;6 months</strong> after Dose 2, Dose 4 not needed.',
        'If first dose at <strong>&ge;4 years</strong>, only 2 additional doses are needed; catch-up through <strong>18 years</strong>.'
      ]
    },
    {
      id: 'mmr', name: 'MMR', abbr: 'MMR', totalDoses: 2,
      minAge: [365, 1461],
      minInterval: [28],
      recAge: [395, 1461],
      liveVaccine: true,
      notes: 'Live vaccine. If 2 live vaccines not given same day, space 28+ days apart.',
      intervalHint: 'Minimum 4 weeks between doses.',
      caveats: [
        'Unvaccinated child <strong>&ge;12 months</strong>: initiate now; total 2-dose series.'
      ]
    },
    {
      id: 'var', name: 'Varicella', abbr: 'VAR', totalDoses: 2,
      minAge: [365, 1461],
      minInterval: [90],
      recAge: [395, 1461],
      liveVaccine: true,
      notes: 'Min interval: 3 months if under 13, 4 weeks if 13+.',
      intervalHint: 'Minimum interval: 3 months if under 13; 4 weeks if 13 or older.',
      caveats: [
        'Unvaccinated at <strong>&ge;13 years</strong>: 2-dose series, minimum 4 weeks apart.',
        'Younger children: standard 2-dose schedule.'
      ]
    },
    {
      id: 'hepa', name: 'Hepatitis A', abbr: 'HepA', totalDoses: 2,
      minAge: [365, 547],
      minInterval: [180],
      recAge: [365, 547],
      notes: '2-dose series. Min interval 6 months.'
    },
    {
      id: 'menacwy', name: 'Meningococcal ACWY', abbr: 'MenACWY', totalDoses: 2,
      minAge: [3653, 5844],
      minInterval: [56],
      recAge: [4018, 5844],
      notes: 'Routine at 11-12 with booster at 16. High-risk may start earlier.',
      intervalHint: 'Minimum 8 weeks between doses in this simplified tool.'
    },
    {
      id: 'tdap', name: 'Tdap', abbr: 'Tdap', totalDoses: 1,
      minAge: [2557],
      minInterval: [],
      recAge: [4018],
      notes: 'Single dose at 11-12 years. Can give regardless of interval since last Td.',
      intervalHint: 'At age >=7 years, use Tdap/Td catch-up (typically 1-3 total doses based on prior history).'
    },
    {
      id: 'hpv', name: 'HPV', abbr: 'HPV', totalDoses: 3,
      minAge: [3287, 3287, 3287],
      minInterval: [28, 84],
      recAge: [4018, 4200, 4380],
      notes: 'Minimum age is 9 years (not months). 2 doses if started before 15. 3 doses if started at 15+. Min interval: 5 months (2-dose) or 0/1-2/6m (3-dose).',
      intervalHint: 'Minimum 5 months in 2-dose schedule; 3-dose schedule uses 0, 1-2, and 6 months. Unvaccinated start after age 26 is not routine.',
      caveats: [
        'Start before <strong>15 years</strong>: 2-dose series.',
        'Start at/after <strong>15 years</strong>: 3-dose series; routine through <strong>26 years</strong>.',
        'If unvaccinated and <strong>older than 26 years</strong>, routine catch-up start is not recommended.'
      ]
    }
  ];

  function parseDateInput(dateISO) {
    var d = new Date(dateISO + 'T00:00:00');
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid date input. Use YYYY-MM-DD format.');
    }
    return d;
  }

  function calculateAgeDays(dobISO, todayISO) {
    if (!dobISO || !todayISO) {
      throw new Error('Date of birth and today date are required.');
    }
    var d1 = parseDateInput(dobISO);
    var d2 = parseDateInput(todayISO);
    return Math.round((d2 - d1) / MS_PER_DAY);
  }

  function formatAgeDisplay(ageDays) {
    if (!Number.isFinite(ageDays) || ageDays < 0) return '';
    if (ageDays < 30) return ageDays + ' days old';
    if (ageDays < 365) return Math.floor(ageDays / 30.44) + ' months old (' + ageDays + ' days)';
    return (ageDays / 365.25).toFixed(1) + ' years old (' + Math.floor(ageDays / 30.44) + ' months)';
  }

  function normalizeReceived(receivedByVaccine) {
    var received = {};
    if (!receivedByVaccine || typeof receivedByVaccine !== 'object') {
      return received;
    }
    Object.keys(receivedByVaccine).forEach(function (key) {
      var n = Number(receivedByVaccine[key]);
      if (Number.isFinite(n) && n > 0) {
        received[key] = Math.floor(n);
      }
    });
    return received;
  }

  function applyDynamicRules(s, ageDays, dosesGiven, received) {
    var out = {
      effectiveTotal: s.totalDoses,
      minAge: null,
      minInterval: null,
      decisionNote: '',
      agedOutMessage: ''
    };

    if (s.id === 'hib' && ageDays >= AGE_15_MO && ageDays < (s.maxCatchupAge || 99999)) {
      out.effectiveTotal = dosesGiven > 0 ? dosesGiven : 1;
      out.minAge = [AGE_15_MO];
      out.decisionNote = 'At age >=15 months in healthy children, one Hib dose generally completes the series.';
    }

    if (s.id === 'pcv' && ageDays >= AGE_24_MO && ageDays < (s.maxCatchupAge || 99999)) {
      out.effectiveTotal = dosesGiven > 0 ? dosesGiven : 1;
      out.minAge = [AGE_24_MO];
      out.decisionNote = 'At age >=24 months in healthy children, one PCV dose generally completes the series.';
    }

    if (s.id === 'ipv') {
      if (ageDays > AGE_18_YR) {
        out.agedOutMessage = 'Routine IPV catch-up is generally through age 18 years.';
        return out;
      }
      if (ageDays >= AGE_4_YR) {
        if (dosesGiven === 0) {
          out.effectiveTotal = 3;
          out.minAge = [AGE_4_YR, AGE_4_YR, AGE_4_YR];
          out.minInterval = [28, 180];
          out.decisionNote = 'If first IPV dose is at >=4 years, total series is typically 3 doses.';
        } else if (dosesGiven >= 3) {
          out.effectiveTotal = 3;
          out.decisionNote = 'Dose 4 may be unnecessary if Dose 3 was at >=4 years and >=6 months after Dose 2.';
        }
      }
    }

    if (s.id === 'dtap') {
      if (ageDays >= AGE_7_YR) {
        out.agedOutMessage = 'Use Tdap/Td catch-up (not DTaP) at age >=7 years.';
        return out;
      }
      if (ageDays >= AGE_4_YR && dosesGiven >= 4) {
        out.effectiveTotal = 4;
        out.decisionNote = 'Dose 5 may be unnecessary if Dose 4 was at >=4 years and >=6 months after Dose 3.';
      }
    }

    if (s.id === 'tdap' && ageDays >= AGE_7_YR) {
      var tetanusCount = (received.dtap || 0) + (received.tdap || 0);
      if (tetanusCount === 0) {
        out.effectiveTotal = 3;
        out.minAge = [AGE_7_YR, AGE_7_YR, AGE_7_YR];
        out.minInterval = [28, 180];
        out.decisionNote = 'At age >=7 years with no prior tetanus doses, a 3-dose Tdap/Td catch-up series is typical.';
      } else if (tetanusCount === 1) {
        out.effectiveTotal = 2;
        out.minAge = [AGE_7_YR, AGE_7_YR];
        out.minInterval = [180];
        out.decisionNote = 'At age >=7 years with one prior tetanus dose, 2 additional Tdap/Td doses are typically needed.';
      } else {
        out.effectiveTotal = 1;
        out.minAge = [AGE_7_YR];
        out.decisionNote = 'At age >=7 years with 2+ prior tetanus doses, one Tdap dose is typically needed.';
      }
    }

    if (s.id === 'hpv') {
      if (ageDays > AGE_26_YR && dosesGiven === 0) {
        out.agedOutMessage = 'Not eligible for routine HPV catch-up start after age 26 years if unvaccinated.';
        return out;
      }
      if (ageDays >= AGE_15_YR) {
        out.effectiveTotal = Math.max(3, dosesGiven);
        out.minAge = [3287, 3287, 3287];
        out.minInterval = [28, 84];
        out.decisionNote = 'Assuming start at >=15 years: 3-dose HPV schedule (0, 1-2, 6 months).';
      } else {
        out.effectiveTotal = Math.max(2, dosesGiven);
        out.minAge = [3287, 3287];
        out.minInterval = [150];
        out.decisionNote = 'Assuming start before 15 years: 2-dose HPV schedule with minimum 5-month interval.';
      }
    }

    if (s.id === 'var' && ageDays >= AGE_13_YR) {
      out.minInterval = [28];
      out.decisionNote = 'At age >=13 years, varicella doses use a minimum 4-week interval.';
    }

    return out;
  }

  function computeCatchupPlan(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('computeCatchupPlan requires an input object.');
    }

    var ageDays = calculateAgeDays(input.dobISO, input.todayISO);
    if (ageDays < 0) {
      throw new Error("Today's date must be after date of birth.");
    }

    var received = normalizeReceived(input.receivedByVaccine);
    var plan = [];
    var totalDue = 0;
    var totalComplete = 0;

    SERIES.forEach(function (s) {
      var dosesGiven = received[s.id] || 0;
      var dynamic = applyDynamicRules(s, ageDays, dosesGiven, received);
      var effectiveTotal = dynamic.effectiveTotal;
      var minAgeSource = dynamic.minAge || s.minAge;
      var minIntervalSource = dynamic.minInterval || s.minInterval;
      var dosesNeeded = effectiveTotal - dosesGiven;

      if (dosesGiven === 0 && s.maxFirstDose && ageDays > s.maxFirstDose) {
        var startLimitMsg = 'Too old to start this series (max first dose age exceeded).';
        if (s.id === 'rv') {
          startLimitMsg = 'Do not initiate the first dose of rotavirus vaccine at >=15 weeks of age due to increased risk of intussusception (max first dose age is 14 weeks 6 days).';
        }
        plan.push({
          vaccine: s,
          status: 'aged-out',
          dosesGiven: 0,
          dosesNeeded: 0,
          message: startLimitMsg
        });
        return;
      }

      if (dynamic.agedOutMessage) {
        plan.push({
          vaccine: s,
          status: 'aged-out',
          dosesGiven: dosesGiven,
          dosesNeeded: 0,
          message: dynamic.agedOutMessage,
          ruleNote: dynamic.decisionNote
        });
        return;
      }

      if (s.maxCatchupAge && ageDays >= s.maxCatchupAge && dosesGiven < s.totalDoses) {
        plan.push({
          vaccine: s,
          status: 'aged-out',
          dosesGiven: dosesGiven,
          dosesNeeded: 0,
          message: s.maxCatchupMessage || 'Routine catch-up no longer indicated above maximum age.'
        });
        return;
      }

      if (s.maxAge && ageDays > s.maxAge && dosesGiven < s.totalDoses) {
        var maxAgeMsg = 'Past maximum age for this vaccine.';
        if (s.id === 'rv') {
          maxAgeMsg = 'Past maximum age for rotavirus dosing (8 months 0 days).';
        }
        plan.push({
          vaccine: s,
          status: 'aged-out',
          dosesGiven: dosesGiven,
          dosesNeeded: 0,
          message: maxAgeMsg
        });
        return;
      }

      if (dosesGiven === 0 && ageDays < minAgeSource[0]) {
        return;
      }

      if (dosesNeeded <= 0) {
        plan.push({
          vaccine: s,
          status: 'complete',
          dosesGiven: dosesGiven,
          dosesNeeded: 0,
          targetDoses: effectiveTotal,
          ruleNote: dynamic.decisionNote
        });
        totalComplete++;
        return;
      }

      var nextDoses = [];
      for (var i = dosesGiven; i < effectiveTotal; i++) {
        var minAgeDays = minAgeSource[i] || minAgeSource[minAgeSource.length - 1] || 0;
        var minIntervalDays = (i > 0 && minIntervalSource[i - 1]) ? minIntervalSource[i - 1] : 0;
        var recAgeDays = s.recAge[i] || 0;

        nextDoses.push({
          doseNum: i + 1,
          minAge: minAgeDays,
          minInterval: minIntervalDays,
          recAge: recAgeDays,
          isOverdue: ageDays > recAgeDays + 30
        });
      }

      totalDue += dosesNeeded;
      plan.push({
        vaccine: s,
        status: 'due',
        dosesGiven: dosesGiven,
        dosesNeeded: dosesNeeded,
        nextDoses: nextDoses,
        targetDoses: effectiveTotal,
        ruleNote: dynamic.decisionNote
      });
    });

    return {
      ageDays: ageDays,
      plan: plan,
      totalDue: totalDue,
      totalComplete: totalComplete,
      dueSeriesCount: plan.filter(function (p) { return p.status === 'due'; }).length
    };
  }

  return {
    SERIES: SERIES,
    calculateAgeDays: calculateAgeDays,
    formatAgeDisplay: formatAgeDisplay,
    computeCatchupPlan: computeCatchupPlan,
    AGE_CONSTANTS: {
      AGE_15_MO: AGE_15_MO,
      AGE_24_MO: AGE_24_MO,
      AGE_4_YR: AGE_4_YR,
      AGE_7_YR: AGE_7_YR,
      AGE_13_YR: AGE_13_YR,
      AGE_15_YR: AGE_15_YR,
      AGE_18_YR: AGE_18_YR,
      AGE_26_YR: AGE_26_YR
    }
  };
});
