/* ================================================================
   TinyHumanMD | Catch-Up Immunization Calculator
   UI and rendering layer backed by catch-up-engine.js
   ================================================================ */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var engine = window.TinyCatchupEngine;

  if (!engine || !Array.isArray(engine.SERIES) || typeof engine.computeCatchupPlan !== 'function') {
    throw new Error('Missing catch-up engine. Ensure catch-up-engine.js is loaded before catch-up.js.');
  }

  var SERIES = engine.SERIES;

  /* ── Build vaccine history form ──────────────────────────── */
  function buildHistoryForm() {
    var container = $('#vaccineHistory');
    container.innerHTML = SERIES.map(function (s) {
      var doses = '';
      for (var i = 0; i < s.totalDoses; i++) {
        doses += '<div class="dose-row">' +
          '<label class="dose-check">' +
            '<input type="checkbox" data-vaccine="' + s.id + '" data-dose="' + (i + 1) + '" />' +
            ' Dose ' + (i + 1) +
          '</label>' +
        '</div>';
      }
      return '<div class="vaccine-group">' +
        '<div class="vaccine-group-header">' +
          '<span class="vaccine-group-name">' + s.name + '</span>' +
          '<span class="vaccine-group-abbr">' + s.abbr + '</span>' +
        '</div>' + doses +
        '<div class="dose-validity-note">Prior doses must meet minimum interval requirements to be considered valid.</div>' +
        (s.intervalHint ? '<div class="dose-validity-rule">' + s.intervalHint + '</div>' : '') +
      '</div>';
    }).join('');
  }

  function renderCaveatBlock(vaccine) {
    if (!vaccine || !vaccine.caveats || !vaccine.caveats.length) return '';
    return '<details class="plan-caveats">' +
      '<summary>Catch-Up Caveats &amp; Hard Stop Rules</summary>' +
      '<ul>' + vaccine.caveats.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>' +
    '</details>';
  }

  function getReceivedDoseCounts() {
    var checks = document.querySelectorAll('#vaccineHistory input[type="checkbox"]');
    var received = {};

    checks.forEach(function (cb) {
      if (!cb.checked) return;
      var vaccineId = cb.dataset.vaccine;
      if (!received[vaccineId]) received[vaccineId] = 0;
      received[vaccineId]++;
    });

    return received;
  }

  /* ── Calculate age and update display ────────────────────── */
  function updateAge() {
    var dob = $('#dob').value;
    var today = $('#todayDate').value;
    var ageEl = $('#ageDisplay');

    if (!dob || !today) {
      ageEl.style.display = 'none';
      return;
    }

    try {
      var ageDays = engine.calculateAgeDays(dob, today);
      if (ageDays < 0) {
        ageEl.style.display = 'none';
        return;
      }
      ageEl.textContent = 'Child is ' + engine.formatAgeDisplay(ageDays);
      ageEl.style.display = '';
    } catch (error) {
      ageEl.style.display = 'none';
    }
  }

  /* ── Generate catch-up plan ──────────────────────────────── */
  function calculate() {
    var dob = $('#dob').value;
    var today = $('#todayDate').value;
    if (!dob || !today) {
      alert('Please enter date of birth and today\'s date.');
      return;
    }

    var result;
    try {
      result = engine.computeCatchupPlan({
        dobISO: dob,
        todayISO: today,
        receivedByVaccine: getReceivedDoseCounts()
      });
    } catch (error) {
      alert(error && error.message ? error.message : 'Unable to generate catch-up plan.');
      return;
    }

    if (window.TinyTrack) {
      window.TinyTrack.calcUsed('catch-up', {
        totalDue: result.totalDue,
        totalComplete: result.totalComplete
      });
    }

    displayPlan(result.plan, result.totalDue, result.totalComplete, result.ageDays);
  }

  function formatDays(days) {
    if (days < 28) return days + ' days';
    if (days < 365) return Math.round(days / 7) + ' weeks';
    return (days / 365.25).toFixed(1) + ' years';
  }

  function displayPlan(plan, totalDue, totalComplete) {
    $('#resultsCard').style.display = '';
    var summary = $('#planSummary');
    var details = $('#planDetails');

    if (totalDue === 0) {
      summary.className = 'plan-summary all-caught-up';
      summary.textContent = 'All caught up! No additional vaccines needed at this time.';
      details.innerHTML = '';
      return;
    }

    var dueSeriesCount = plan.filter(function (p) { return p.status === 'due'; }).length;

    summary.className = 'plan-summary needs-catchup';
    summary.innerHTML = '<strong>' + totalDue + ' dose' + (totalDue > 1 ? 's' : '') + ' needed</strong> across ' +
      dueSeriesCount + ' vaccine' + (dueSeriesCount > 1 ? ' series' : '') + '. ' +
      totalComplete + ' series complete. ' +
      '<br><span style="font-size:var(--text-xs);color:var(--c-text-secondary)">A series never needs to be restarted, regardless of time elapsed between doses.</span>';

    details.innerHTML = plan.map(function (p) {
      if (p.status === 'complete') {
        return '<div class="plan-vaccine">' +
          '<div class="plan-vaccine-header">' +
            '<span class="plan-vaccine-name">' + p.vaccine.name + ' (' + p.vaccine.abbr + ')</span>' +
            '<span class="plan-vaccine-status status-complete">Complete</span>' +
          '</div>' +
          '<div style="font-size:var(--text-sm);color:var(--c-text-secondary)">' + p.dosesGiven + '/' + (p.targetDoses || p.vaccine.totalDoses) + ' doses received</div>' +
          (p.ruleNote ? '<div class="plan-rule-note">' + p.ruleNote + '</div>' : '') +
          renderCaveatBlock(p.vaccine) +
        '</div>';
      }

      if (p.status === 'aged-out') {
        return '<div class="plan-vaccine" style="opacity:.6">' +
          '<div class="plan-vaccine-header">' +
            '<span class="plan-vaccine-name">' + p.vaccine.name + ' (' + p.vaccine.abbr + ')</span>' +
            '<span class="plan-vaccine-status" style="background:var(--c-border-light);color:var(--c-text-muted)">N/A</span>' +
          '</div>' +
          '<div style="font-size:var(--text-sm);color:var(--c-text-muted)">' + p.message + '</div>' +
          (p.ruleNote ? '<div class="plan-rule-note">' + p.ruleNote + '</div>' : '') +
          renderCaveatBlock(p.vaccine) +
        '</div>';
      }

      if (p.status === 'due') {
        var doseItems = (p.nextDoses || []).map(function (d) {
          return '<div class="plan-dose-item">' +
            '<span class="plan-dose-num">Dose ' + d.doseNum + '</span>' +
            '<span class="plan-dose-info">' +
              'Min age: <strong>' + formatDays(d.minAge) + '</strong>' +
              (d.minInterval ? ' | Min interval from prev: <strong>' + formatDays(d.minInterval) + '</strong>' : '') +
              (d.isOverdue ? ' <span style="color:var(--c-red);font-weight:600">(OVERDUE)</span>' : '') +
            '</span>' +
          '</div>';
        }).join('');

        return '<div class="plan-vaccine">' +
          '<div class="plan-vaccine-header">' +
            '<span class="plan-vaccine-name">' + p.vaccine.name + ' (' + p.vaccine.abbr + ')</span>' +
            '<span class="plan-vaccine-status status-due">' + p.dosesNeeded + ' dose' + (p.dosesNeeded > 1 ? 's' : '') + ' needed</span>' +
          '</div>' +
          '<div style="font-size:var(--text-sm);color:var(--c-text-secondary);margin-bottom:var(--s-2)">' +
            p.dosesGiven + '/' + (p.targetDoses || p.vaccine.totalDoses) + ' received' +
          '</div>' +
          (p.ruleNote ? '<div class="plan-rule-note">' + p.ruleNote + '</div>' : '') +
          '<div class="plan-dose-list">' + doseItems + '</div>' +
          (p.vaccine.notes ? '<div style="font-size:var(--text-xs);color:var(--c-text-muted);margin-top:var(--s-2);padding-top:var(--s-2);border-top:1px solid var(--c-border-light)">' + p.vaccine.notes + '</div>' : '') +
          renderCaveatBlock(p.vaccine) +
        '</div>';
      }

      return '';
    }).join('');
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    var today = new Date().toISOString().split('T')[0];
    $('#todayDate').value = today;
    buildHistoryForm();

    $('#dob').addEventListener('change', updateAge);
    $('#todayDate').addEventListener('change', updateAge);
    $('#calcBtn').addEventListener('click', calculate);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
