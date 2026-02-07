/* ================================================================
   Vaccines Made Easy | Immunization Schedule Application
   ================================================================ */

(function () {
  'use strict';

  /* -------- Data -------- */
  const AGE_COLS = [
    { key: 'birth', label: 'Birth' },
    { key: '1mo',   label: '1 mo' },
    { key: '2mo',   label: '2 mos' },
    { key: '4mo',   label: '4 mos' },
    { key: '6mo',   label: '6 mos' },
    { key: '9mo',   label: '9 mos' },
    { key: '12mo',  label: '12 mos' },
    { key: '15mo',  label: '15 mos' },
    { key: '18mo',  label: '18 mos' },
    { key: '2yr',   label: '2-3 yrs' },
    { key: '4yr',   label: '4-6 yrs' },
    { key: '7yr',   label: '7-10 yrs' },
    { key: '11yr',  label: '11-12 yrs' },
    { key: '13yr',  label: '13-15 yrs' },
    { key: '16yr',  label: '16 yrs' },
    { key: '17yr',  label: '17-18 yrs' },
  ];

  // Catch-up interval columns
  const CU_COLS = ['Minimum Age', 'Dose 1 to 2', 'Dose 2 to 3', 'Dose 3 to 4', 'Dose 4 to 5'];

  // type: rec = recommended, catch = catch-up, risk = high-risk, shared = shared decision, note = see notes
  const VACCINES = [
    {
      id: 'hepb',
      name: 'Hepatitis B',
      abbr: 'HepB',
      doses: 3,
      description: 'Protects against hepatitis B virus infection, which can cause chronic liver disease and liver cancer.',
      notes: 'Administer monovalent HepB vaccine to all newborns within 24 hours of birth. The 2nd dose should be given at age 1 month and the 3rd dose at 6-18 months (minimum age for the 3rd dose is 24 weeks).',
      contraindications: 'Severe allergic reaction (anaphylaxis) after a previous dose or to a vaccine component.',
      schedule: {
        birth:  { type: 'rec', label: '1st' },
        '1mo':  { type: 'rec', label: '2nd' },
        '6mo':  { type: 'rec', label: '3rd' },
        '2mo':  { type: 'catch', label: '2nd' },
        '4mo':  { type: 'catch', label: '2nd-3rd' },
        '9mo':  { type: 'catch', label: '3rd' },
        '12mo': { type: 'catch', label: '3rd' },
        '15mo': { type: 'catch', label: '3rd' },
        '18mo': { type: 'catch', label: '3rd' },
      },
      catchup: {
        group: 'young',
        minAge: 'Birth',
        intervals: [
          { interval: '4 weeks' },
          { interval: '8 weeks', detail: 'and at least 16 weeks after first dose. Minimum age for the final dose is 24 weeks.' },
        ],
      },
      catchupOlder: {
        group: 'older',
        minAge: 'N/A',
        intervals: [
          { interval: '4 weeks' },
          { interval: '8 weeks', detail: 'and at least 16 weeks after first dose.' },
        ],
      },
    },
    {
      id: 'rv',
      name: 'Rotavirus',
      abbr: 'RV',
      doses: 3,
      description: 'Prevents severe rotavirus gastroenteritis in infants and young children.',
      notes: 'RV1 is a 2-dose series at 2 and 4 months. RV5 is a 3-dose series at 2, 4, and 6 months. Do not administer after age 8 months 0 days.',
      contraindications: 'Severe allergic reaction after previous dose. History of intussusception. Severe combined immunodeficiency (SCID).',
      schedule: {
        '2mo': { type: 'rec', label: '1st' },
        '4mo': { type: 'rec', label: '2nd' },
        '6mo': { type: 'rec', label: '3rd' },
      },
      catchup: {
        group: 'young',
        minAge: '6 weeks',
        minAgeDetail: 'Maximum age for first dose is 14 weeks 6 days.',
        intervals: [
          { interval: '4 weeks' },
          { interval: '4 weeks', detail: 'Maximum age for final dose is 8 months 0 days.' },
        ],
      },
    },
    {
      id: 'dtap',
      name: 'Diphtheria, Tetanus & Pertussis',
      abbr: 'DTaP',
      doses: 5,
      description: 'Protects against diphtheria, tetanus (lockjaw), and pertussis (whooping cough). For children under 7 years.',
      notes: 'The 4th dose may be given as early as 12 months if at least 6 months have elapsed since the 3rd dose. The 5th dose is not necessary if the 4th dose was administered at age 4 years or older.',
      contraindications: 'Severe allergic reaction after a previous dose. Encephalopathy within 7 days of a previous dose.',
      schedule: {
        '2mo':  { type: 'rec', label: '1st' },
        '4mo':  { type: 'rec', label: '2nd' },
        '6mo':  { type: 'rec', label: '3rd' },
        '15mo': { type: 'rec', label: '4th' },
        '18mo': { type: 'rec', label: '4th' },
        '4yr':  { type: 'rec', label: '5th' },
      },
      catchup: {
        group: 'young',
        minAge: '6 weeks',
        intervals: [
          { interval: '4 weeks' },
          { interval: '4 weeks' },
          { interval: '6 months' },
          { interval: '6 months', detail: 'A 5th dose is not necessary if the 4th dose was given at age 4+ and at least 6 months after dose 3.' },
        ],
      },
    },
    {
      id: 'hib',
      name: 'Haemophilus influenzae type b',
      abbr: 'Hib',
      doses: 4,
      description: 'Prevents invasive Hib disease including meningitis, epiglottitis, and pneumonia.',
      notes: 'Number of doses depends on vaccine type. PRP-OMP (PedvaxHIB) requires a 2-dose primary series; all others require 3 doses plus a booster.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component. Age less than 6 weeks.',
      schedule: {
        '2mo':  { type: 'rec', label: '1st' },
        '4mo':  { type: 'rec', label: '2nd' },
        '6mo':  { type: 'note', label: 'See notes' },
        '12mo': { type: 'rec', label: '3rd/4th' },
        '15mo': { type: 'rec', label: '3rd/4th' },
      },
      catchup: {
        group: 'young',
        minAge: '6 weeks',
        intervals: [
          { interval: '4 weeks', detail: 'if 1st dose given before 1st birthday. 8 weeks (as final dose) if 1st dose at 12-14 months. No further doses if 1st dose at 15+ months.' },
          { interval: '4-8 weeks', detail: 'Depends on current age, age at 1st dose, and vaccine type. See CDC notes for full guidance.' },
          { interval: '8 weeks', detail: 'As final dose. Only needed for children 12-59 months who received 3 doses before 1st birthday.' },
        ],
      },
    },
    {
      id: 'pcv',
      name: 'Pneumococcal Conjugate',
      abbr: 'PCV',
      doses: 4,
      description: 'Protects against pneumococcal diseases including pneumonia, meningitis, and bloodstream infections.',
      notes: 'PCV15 or PCV20 may be used. 1 dose of PCV20 or 1 dose of PCV15 followed by PPSV23 is recommended for certain at-risk children aged 2-18 years.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component.',
      schedule: {
        '2mo':  { type: 'rec', label: '1st' },
        '4mo':  { type: 'rec', label: '2nd' },
        '6mo':  { type: 'rec', label: '3rd' },
        '12mo': { type: 'rec', label: '4th' },
        '15mo': { type: 'rec', label: '4th' },
      },
      catchup: {
        group: 'young',
        minAge: '6 weeks',
        intervals: [
          { interval: '4 weeks', detail: 'if 1st dose before 1st birthday. 8 weeks (as final dose for healthy children) if 1st dose at 1st birthday or after. No further doses if healthy child and 1st dose at 24+ months.' },
          { interval: '4-8 weeks', detail: 'Depends on current age and age at prior doses. See CDC notes.' },
          { interval: '8 weeks', detail: 'As final dose. Only for children 12-59 months who received 3 doses before 12 months.' },
        ],
      },
    },
    {
      id: 'ipv',
      name: 'Inactivated Poliovirus',
      abbr: 'IPV',
      doses: 4,
      description: 'Provides protection against poliovirus, which can cause paralysis and death.',
      notes: 'The final dose should be administered at age 4-6 years, regardless of the number of previous doses, and should be given at least 6 months after the previous dose.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component (streptomycin, polymyxin B, or neomycin).',
      schedule: {
        '2mo':  { type: 'rec', label: '1st' },
        '4mo':  { type: 'rec', label: '2nd' },
        '6mo':  { type: 'rec', label: '3rd' },
        '12mo': { type: 'catch', label: '3rd' },
        '18mo': { type: 'catch', label: '3rd' },
        '4yr':  { type: 'rec', label: '4th' },
        '7yr':  { type: 'note', label: 'See notes' },
      },
      catchup: {
        group: 'young',
        minAge: '6 weeks',
        intervals: [
          { interval: '4 weeks' },
          { interval: '4 weeks', detail: 'if current age is under 4 years. 6 months (as final dose) if current age is 4+ years.' },
          { interval: '6 months', detail: 'Minimum age 4 years for final dose.' },
        ],
      },
      catchupOlder: {
        group: 'older',
        minAge: 'N/A',
        intervals: [
          { interval: '4 weeks' },
          { interval: '6 months', detail: 'A 4th dose is not necessary if the 3rd dose was given at age 4+ and at least 6 months after previous dose.' },
          { interval: '6 months', detail: 'A 4th dose of IPV is indicated if all previous doses were given before age 4 or if the 3rd dose was less than 6 months after the 2nd.' },
        ],
      },
    },
    {
      id: 'flu',
      name: 'Influenza',
      abbr: 'IIV / LAIV',
      doses: null,
      description: 'Annual influenza vaccination for all persons aged 6 months and older. IIV and LAIV are available formulations.',
      notes: 'Administer annually. Children aged 6 months through 8 years who need 2 doses should receive the first dose as soon as vaccine is available. LAIV (nasal spray) is approved for ages 2 years and older.',
      contraindications: 'Severe allergic reaction to any component or after previous dose. LAIV: immunocompromised, pregnancy, children 2-4 with asthma.',
      schedule: {
        '6mo':  { type: 'rec', label: '1-2/yr' },
        '9mo':  { type: 'rec', label: '1-2/yr' },
        '12mo': { type: 'rec', label: '1-2/yr' },
        '15mo': { type: 'rec', label: '1-2/yr' },
        '18mo': { type: 'rec', label: '1-2/yr' },
        '2yr':  { type: 'rec', label: '1/yr' },
        '4yr':  { type: 'rec', label: '1/yr' },
        '7yr':  { type: 'rec', label: '1/yr' },
        '11yr': { type: 'rec', label: '1/yr' },
        '13yr': { type: 'rec', label: '1/yr' },
        '16yr': { type: 'rec', label: '1/yr' },
        '17yr': { type: 'rec', label: '1/yr' },
      },
    },
    {
      id: 'mmr',
      name: 'Measles, Mumps, Rubella',
      abbr: 'MMR',
      doses: 2,
      description: 'Protects against measles, mumps, and rubella (German measles), all highly contagious viral diseases.',
      notes: 'Administer 1st dose at 12-15 months and 2nd dose at 4-6 years. Can be administered before age 12 months for international travel (dose before 12 months does not count toward the routine series).',
      contraindications: 'Severe allergic reaction after previous dose or to a component. Pregnancy. Known severe immunodeficiency.',
      schedule: {
        '12mo': { type: 'rec', label: '1st' },
        '15mo': { type: 'rec', label: '1st' },
        '4yr':  { type: 'rec', label: '2nd' },
        '7yr':  { type: 'catch', label: '2nd' },
      },
      catchup: {
        group: 'young',
        minAge: '12 months',
        intervals: [
          { interval: '4 weeks' },
        ],
      },
      catchupOlder: {
        group: 'older',
        minAge: 'N/A',
        intervals: [
          { interval: '4 weeks' },
        ],
      },
    },
    {
      id: 'var',
      name: 'Varicella',
      abbr: 'VAR',
      doses: 2,
      description: 'Prevents chickenpox (varicella), a highly contagious disease that causes an itchy rash and can lead to serious complications.',
      notes: 'Administer 1st dose at 12-15 months and 2nd dose at 4-6 years. The 2nd dose can be given as early as 3 months after the 1st dose.',
      contraindications: 'Severe allergic reaction after previous dose. Pregnancy. Known severe immunodeficiency.',
      schedule: {
        '12mo': { type: 'rec', label: '1st' },
        '15mo': { type: 'rec', label: '1st' },
        '4yr':  { type: 'rec', label: '2nd' },
        '7yr':  { type: 'catch', label: '2nd' },
      },
      catchup: {
        group: 'young',
        minAge: '12 months',
        intervals: [
          { interval: '3 months' },
        ],
      },
      catchupOlder: {
        group: 'older',
        minAge: 'N/A',
        intervals: [
          { interval: '3 months', detail: 'if younger than 13 years. 4 weeks if age 13 years or older.' },
        ],
      },
    },
    {
      id: 'hepa',
      name: 'Hepatitis A',
      abbr: 'HepA',
      doses: 2,
      description: 'Protects against hepatitis A, a liver infection caused by the hepatitis A virus. Transmitted via contaminated food or water.',
      notes: '2-dose series beginning at 12 months. The 2 doses should be separated by 6-18 months. Catch-up is recommended for anyone 2 years and older who has not been vaccinated.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component.',
      schedule: {
        '12mo': { type: 'rec', label: '1st' },
        '15mo': { type: 'rec', label: '1st' },
        '18mo': { type: 'rec', label: '2nd' },
        '2yr':  { type: 'catch', label: '1st-2nd' },
      },
      catchup: {
        group: 'young',
        minAge: '12 months',
        intervals: [
          { interval: '6 months' },
        ],
      },
      catchupOlder: {
        group: 'older',
        minAge: 'N/A',
        intervals: [
          { interval: '6 months' },
        ],
      },
    },
    {
      id: 'menacwy',
      name: 'Meningococcal ACWY',
      abbr: 'MenACWY',
      doses: 2,
      description: 'Protects against meningococcal serogroups A, C, W, and Y, which cause bacterial meningitis and bloodstream infections.',
      notes: 'Administer 1st dose at 11-12 years with booster at age 16. For children at increased risk, a series can begin as early as 2 months.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component.',
      schedule: {
        '2mo':  { type: 'risk', label: 'High risk' },
        '11yr': { type: 'rec', label: '1st' },
        '16yr': { type: 'rec', label: '2nd' },
      },
      catchup: {
        group: 'young',
        minAge: '2 months (CRM), 2 years (TT)',
        intervals: [
          { interval: '8 weeks' },
          { interval: 'See Notes', detail: 'Depends on indication and age.' },
        ],
      },
      catchupOlder: {
        group: 'older',
        minAge: 'N/A',
        intervals: [
          { interval: '8 weeks' },
        ],
      },
    },
    {
      id: 'tdap',
      name: 'Tetanus, Diphtheria & Pertussis',
      abbr: 'Tdap',
      doses: 1,
      description: 'Booster for older children and adolescents. Replaces Td booster with added pertussis protection.',
      notes: 'Administer 1 dose of Tdap at age 11-12 years. Tdap can be administered regardless of interval since last tetanus- or diphtheria-containing vaccine.',
      contraindications: 'Severe allergic reaction after a previous dose. Encephalopathy within 7 days of a previous pertussis-containing vaccine.',
      schedule: {
        '11yr': { type: 'rec', label: '1 dose' },
        '13yr': { type: 'catch', label: '1 dose' },
      },
      catchupOlder: {
        group: 'older',
        minAge: '7 years',
        intervals: [
          { interval: '4 weeks' },
          { interval: '4 weeks', detail: 'if 1st dose of DTaP/DT was before 1st birthday. 6 months (as final dose) if 1st dose was at or after 1st birthday.' },
          { interval: '6 months', detail: 'if 1st dose of DTaP/DT was before 1st birthday.' },
        ],
      },
    },
    {
      id: 'hpv',
      name: 'Human Papillomavirus',
      abbr: 'HPV',
      doses: 2,
      description: 'Prevents HPV infections that cause cervical, anal, oropharyngeal, and other cancers, as well as genital warts.',
      notes: 'Routine vaccination at 11-12 years (can begin at age 9). If started before 15, 2-dose series (0, 6-12 months). If started at 15 or older, 3-dose series (0, 1-2, 6 months).',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component (including yeast).',
      schedule: {
        '9mo':  { type: 'shared', label: 'Can begin' },
        '11yr': { type: 'rec', label: '1st' },
        '13yr': { type: 'rec', label: '2nd' },
        '16yr': { type: 'catch', label: '1st-2nd' },
        '17yr': { type: 'catch', label: '1st-3rd' },
      },
      catchupOlder: {
        group: 'older',
        minAge: '9 years',
        intervals: [
          { interval: 'Routine dosing intervals are recommended.' },
        ],
      },
    },
    {
      id: 'menb',
      name: 'Meningococcal B',
      abbr: 'MenB',
      doses: 2,
      description: 'Protects against meningococcal serogroup B disease. Recommended based on shared clinical decision-making for adolescents.',
      notes: 'Based on shared clinical decision-making for 16-23 year olds (preferred age 16-18). A 2-dose series of MenB-4C or a 2- or 3-dose series of MenB-FHbp.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component.',
      schedule: {
        '16yr': { type: 'shared', label: '2-3 doses' },
        '17yr': { type: 'shared', label: '2-3 doses' },
      },
    },
    {
      id: 'rsv',
      name: 'RSV (Nirsevimab)',
      abbr: 'RSV-mAb',
      doses: 1,
      description: 'Monoclonal antibody for passive immunization against respiratory syncytial virus in infants.',
      notes: 'Administer 1 dose to infants born during or entering their first RSV season. A second season dose is recommended for children 8-19 months at increased risk.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component.',
      schedule: {
        birth:  { type: 'rec', label: '1 dose' },
        '1mo':  { type: 'rec', label: '1 dose' },
        '2mo':  { type: 'rec', label: '1 dose' },
        '4mo':  { type: 'rec', label: '1 dose' },
        '6mo':  { type: 'rec', label: '1 dose' },
        '9mo':  { type: 'risk', label: '2nd season' },
        '12mo': { type: 'risk', label: '2nd season' },
        '15mo': { type: 'risk', label: '2nd season' },
        '18mo': { type: 'risk', label: '2nd season' },
      },
    },
    {
      id: 'covid',
      name: 'COVID-19',
      abbr: 'COVID',
      doses: null,
      description: 'Protects against SARS-CoV-2 infection. Updated vaccines are recommended seasonally.',
      notes: 'See current CDC guidance for updated COVID-19 vaccine recommendations, which may change based on circulating variants. Available for ages 6 months and older.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component (including PEG or polysorbate).',
      schedule: {
        '6mo':  { type: 'note', label: 'See notes' },
        '9mo':  { type: 'note', label: 'See notes' },
        '12mo': { type: 'note', label: 'See notes' },
        '15mo': { type: 'note', label: 'See notes' },
        '18mo': { type: 'note', label: 'See notes' },
        '2yr':  { type: 'note', label: 'See notes' },
        '4yr':  { type: 'note', label: 'See notes' },
        '7yr':  { type: 'note', label: 'See notes' },
        '11yr': { type: 'note', label: 'See notes' },
        '13yr': { type: 'note', label: 'See notes' },
        '16yr': { type: 'note', label: 'See notes' },
        '17yr': { type: 'note', label: 'See notes' },
      },
    },
    {
      id: 'dengue',
      name: 'Dengue',
      abbr: 'DEN4CYD',
      doses: 3,
      description: 'Prevents dengue disease in seropositive individuals living in endemic areas. For ages 9-16 years.',
      notes: 'Only for children aged 9-16 years with laboratory-confirmed previous dengue infection living in endemic dengue areas.',
      contraindications: 'Severe allergic reaction after a previous dose or to a vaccine component. Seronegative individuals.',
      schedule: {
        '11yr': { type: 'risk', label: 'Seropositive' },
        '13yr': { type: 'risk', label: 'Seropositive' },
        '16yr': { type: 'risk', label: 'Seropositive' },
      },
      catchupOlder: {
        group: 'older',
        minAge: '9 years',
        intervals: [
          { interval: '6 months' },
          { interval: '6 months' },
        ],
      },
    },
  ];

  /* -------- Helpers -------- */
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

  const PILL_CLASS = { rec: 'pill-rec', catch: 'pill-catch', risk: 'pill-risk', shared: 'pill-shared', note: 'pill-note' };

  function pillHTML(cell, vaccineId) {
    if (!cell) return '';
    const cls = PILL_CLASS[cell.type] || 'pill-note';
    return `<span class="cell-pill ${cls}" data-vaccine="${vaccineId}">${cell.label}</span>`;
  }

  /* -------- Build Schedule Table -------- */
  function buildTable() {
    const head = $('#tableHead');
    const body = $('#tableBody');
    let hRow = '<tr><th>Vaccine</th>';
    AGE_COLS.forEach(c => { hRow += `<th data-age="${c.key}">${c.label}</th>`; });
    hRow += '</tr>';
    head.innerHTML = hRow;

    let bRows = '';
    VACCINES.forEach(v => {
      const ages = Object.keys(v.schedule);
      bRows += `<tr data-ages="${ages.join(',')}" data-vid="${v.id}">`;
      bRows += `<td>${v.name} <span style="opacity:.45;font-weight:400;">(${v.abbr})</span></td>`;
      AGE_COLS.forEach(c => {
        const cell = v.schedule[c.key];
        bRows += `<td data-age="${c.key}">${pillHTML(cell, v.id)}</td>`;
      });
      bRows += '</tr>';
    });
    body.innerHTML = bRows;

    $$('.cell-pill', body).forEach(el => {
      el.addEventListener('click', () => {
        const vid = el.dataset.vaccine;
        const vac = VACCINES.find(v => v.id === vid);
        if (vac) openModal(vac);
      });
    });
  }

  /* -------- Age Filter -------- */
  function setupAgeFilter() {
    const sel = $('#ageSelect');
    sel.addEventListener('change', () => {
      const val = sel.value;
      $$('#tableBody tr').forEach(tr => {
        if (val === 'all') {
          tr.classList.remove('hidden-row');
        } else {
          const ages = tr.dataset.ages.split(',');
          tr.classList.toggle('hidden-row', !ages.includes(val));
        }
      });
    });
  }

  /* -------- Build Catch-up Table -------- */
  function buildCatchupTable(group) {
    const head = $('#catchupHead');
    const body = $('#catchupBody');
    const maxIntervals = group === 'young' ? 4 : 3;

    let hRow = '<tr><th>Vaccine</th><th>Min. Age</th>';
    for (let i = 0; i < maxIntervals; i++) {
      const from = i + 1;
      const to = i + 2;
      hRow += `<th>Dose ${from} to ${to}</th>`;
    }
    hRow += '</tr>';
    head.innerHTML = hRow;

    let bRows = '';
    VACCINES.forEach(v => {
      const cu = group === 'young' ? v.catchup : v.catchupOlder;
      if (!cu) return;

      bRows += `<tr>`;
      bRows += `<td>${v.name} <span style="opacity:.45;font-weight:400;">(${v.abbr})</span></td>`;

      // Min age cell
      let minAgeHTML = `<span class="cu-minage">${cu.minAge}</span>`;
      if (cu.minAgeDetail) {
        minAgeHTML += `<span class="cu-detail">${cu.minAgeDetail}</span>`;
      }
      bRows += `<td>${minAgeHTML}</td>`;

      // Interval cells
      for (let i = 0; i < maxIntervals; i++) {
        const intv = cu.intervals[i];
        if (intv) {
          let cellHTML = `<span class="cu-interval">${intv.interval}</span>`;
          if (intv.detail) {
            cellHTML += `<span class="cu-detail">${intv.detail}</span>`;
          }
          bRows += `<td>${cellHTML}</td>`;
        } else {
          bRows += `<td></td>`;
        }
      }
      bRows += '</tr>';
    });
    body.innerHTML = bRows;
  }

  function setupCatchupTabs() {
    const tabs = $$('.catchup-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        buildCatchupTable(tab.dataset.group);
      });
    });
    // Build default
    buildCatchupTable('young');
  }

  /* -------- Build Timeline -------- */
  function buildTimeline() {
    const container = $('#timelineContainer');
    const AGE_POS = {
      birth: 0, '1mo': 3, '2mo': 6, '4mo': 10, '6mo': 14, '9mo': 18,
      '12mo': 22, '15mo': 26, '18mo': 30, '2yr': 38, '4yr': 48,
      '7yr': 58, '11yr': 68, '13yr': 76, '16yr': 86, '17yr': 94,
    };
    const COLORS = {
      rec: 'var(--accent)', catch: 'var(--green)', risk: 'var(--purple)', shared: 'var(--orange)', note: '#aaa',
    };

    let html = '';
    VACCINES.forEach(v => {
      const entries = Object.entries(v.schedule);
      if (!entries.length) return;
      const positions = entries.map(([age]) => AGE_POS[age] ?? 0);
      const minP = Math.min(...positions);
      const maxP = Math.max(...positions);
      const mainColor = COLORS[entries[0][1].type] || COLORS.rec;

      html += `<div class="timeline-row">`;
      html += `<div class="timeline-label">${v.abbr}</div>`;
      html += `<div class="timeline-track">`;
      html += `<div class="timeline-bar" style="left:${minP}%;width:${maxP - minP}%;background:${mainColor};"></div>`;
      entries.forEach(([age, cell]) => {
        const pos = AGE_POS[age] ?? 0;
        const col = COLORS[cell.type] || COLORS.rec;
        const ageLabel = AGE_COLS.find(a => a.key === age)?.label || age;
        html += `<div class="timeline-dot" style="left:${pos}%;color:${col};background:${col};" data-vaccine="${v.id}"><span class="dot-tooltip">${cell.label} | ${ageLabel}</span></div>`;
      });
      html += `</div></div>`;
    });

    // Axis
    html += `<div class="timeline-axis"><div class="timeline-axis-spacer"></div><div class="timeline-axis-track">`;
    const axisLabels = [
      { key: 'birth', label: 'Birth' }, { key: '2mo', label: '2m' }, { key: '4mo', label: '4m' },
      { key: '6mo', label: '6m' }, { key: '12mo', label: '1yr' }, { key: '18mo', label: '18m' },
      { key: '2yr', label: '2yr' }, { key: '4yr', label: '4yr' }, { key: '7yr', label: '7yr' },
      { key: '11yr', label: '11yr' }, { key: '13yr', label: '13yr' }, { key: '16yr', label: '16yr' },
      { key: '17yr', label: '18yr' },
    ];
    axisLabels.forEach(a => {
      const pos = AGE_POS[a.key] ?? 0;
      html += `<span class="timeline-axis-label" style="left:${pos}%">${a.label}</span>`;
    });
    html += `</div></div>`;

    container.innerHTML = html;

    $$('.timeline-dot', container).forEach(el => {
      el.addEventListener('click', () => {
        const vid = el.dataset.vaccine;
        const vac = VACCINES.find(v => v.id === vid);
        if (vac) openModal(vac);
      });
    });
  }

  /* -------- Build Vaccine Cards -------- */
  function buildCards() {
    const grid = $('#cardsGrid');
    let html = '';
    VACCINES.forEach(v => {
      html += `<div class="vaccine-card">`;
      html += `<div class="card-header"><div class="card-name">${v.name}</div><div class="card-abbr">${v.abbr}</div></div>`;
      html += `<div class="card-desc">${v.description}</div>`;
      html += `<div class="card-doses">`;
      const doseAges = Object.entries(v.schedule).filter(([, c]) => c.type === 'rec');
      if (doseAges.length) {
        doseAges.forEach(([age, cell]) => {
          const ageLabel = AGE_COLS.find(a => a.key === age)?.label || age;
          html += `<span class="dose-chip active-dose">${cell.label} | ${ageLabel}</span>`;
        });
      } else {
        html += `<span class="dose-chip">See current guidance</span>`;
      }
      html += `</div>`;

      // Catch-up summary
      const cu = v.catchup || v.catchupOlder;
      if (cu) {
        html += `<div style="margin-bottom:12px;">`;
        html += `<span class="dose-chip" style="background:var(--green-light);color:#1a7a32;">Catch-up: min age ${cu.minAge}</span>`;
        html += `</div>`;
      }

      html += `<button class="card-detail-toggle" data-vid="${v.id}">More details <svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
      html += `<div class="card-details" id="details-${v.id}">`;
      html += `<p><strong>Notes:</strong> ${v.notes}</p>`;
      html += `<p style="margin-top:8px"><strong>Contraindications:</strong> ${v.contraindications}</p>`;
      if (cu && cu.intervals.length) {
        html += `<p style="margin-top:8px"><strong>Catch-up intervals:</strong></p><ul style="margin:4px 0 0 16px;">`;
        cu.intervals.forEach((intv, i) => {
          html += `<li>Dose ${i + 1} to ${i + 2}: <strong>${intv.interval}</strong>`;
          if (intv.detail) html += ` <span style="color:var(--text-secondary)">${intv.detail}</span>`;
          html += `</li>`;
        });
        html += `</ul>`;
      }
      html += `</div>`;
      html += `</div>`;
    });
    grid.innerHTML = html;

    $$('.card-detail-toggle', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const details = $(`#details-${btn.dataset.vid}`);
        details.classList.toggle('show');
        btn.classList.toggle('open');
      });
    });
  }

  /* -------- Modal -------- */
  function openModal(vaccine) {
    const overlay = $('#modalOverlay');
    const content = $('#modalContent');
    const doseEntries = Object.entries(vaccine.schedule)
      .map(([age, cell]) => {
        const ageLabel = AGE_COLS.find(a => a.key === age)?.label || age;
        return `<span class="dose-chip" style="margin:2px">${cell.label} | ${ageLabel}</span>`;
      }).join('');

    const cu = vaccine.catchup || vaccine.catchupOlder;
    let catchupHTML = '';
    if (cu) {
      catchupHTML = `
        <p style="margin-top:16px"><strong>Catch-up guidance</strong></p>
        <p style="margin-top:4px">Minimum age: <strong>${cu.minAge}</strong>${cu.minAgeDetail ? ' (' + cu.minAgeDetail + ')' : ''}</p>
        <ul style="margin:6px 0 0 16px;">
          ${cu.intervals.map((intv, i) => `<li>Dose ${i + 1} to ${i + 2}: <strong>${intv.interval}</strong>${intv.detail ? ' <span style="color:var(--text-secondary)">' + intv.detail + '</span>' : ''}</li>`).join('')}
        </ul>
      `;
    }

    content.innerHTML = `
      <h3>${vaccine.name} <span style="font-weight:400;opacity:.5;">(${vaccine.abbr})</span></h3>
      <p class="modal-sub">${vaccine.description}</p>
      <div class="modal-body">
        <p><strong>Dose schedule</strong></p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0 16px;">${doseEntries}</div>
        <p><strong>Clinical notes</strong><br/>${vaccine.notes}</p>
        <p style="margin-top:12px"><strong>Contraindications</strong><br/>${vaccine.contraindications}</p>
        ${catchupHTML}
      </div>
    `;
    overlay.classList.add('open');
  }

  function setupModal() {
    const overlay = $('#modalOverlay');
    const closeBtn = $('#modalClose');
    const close = () => overlay.classList.remove('open');
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* -------- Smooth-scroll nav -------- */
  function setupNav() {
    $$('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        $$('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  /* -------- Build Adult Vaccines -------- */
  function buildAdult() {
    var grid = $('#adultGrid');
    if (!grid) return;
    var items = [
      { badge: 'Annual', cls: 'badge-annual', name: 'Influenza (Flu)', body: 'One dose every flu season for all adults. High-dose or adjuvanted formulations recommended for adults 65+.' },
      { badge: 'Seasonal', cls: 'badge-annual', name: 'COVID-19', body: 'Updated COVID-19 vaccine recommended for all adults. Stay up to date per current CDC guidance as formulations change with circulating variants.' },
      { badge: 'Every 10 yrs', cls: 'badge-routine', name: 'Td / Tdap', body: 'Td booster every 10 years. One dose should be Tdap (includes pertussis). Tdap is especially important for adults around newborns.' },
      { badge: '50+', cls: 'badge-age', name: 'Shingles (Zoster)', body: 'Shingrix: 2-dose series for adults 50 and older, or adults 19+ who are immunocompromised. Doses given 2 to 6 months apart.' },
      { badge: '65+', cls: 'badge-age', name: 'Pneumococcal', body: 'PCV20 (single dose) or PCV15 followed by PPSV23 for adults 65+, or younger adults with certain risk factors (chronic heart, lung, or liver disease, diabetes, smoking).' },
      { badge: 'At risk', cls: 'badge-risk', name: 'Hepatitis B', body: 'Recommended for all adults 19-59. Adults 60+ with risk factors (healthcare workers, chronic liver disease, sexual exposure risk, injection drug use) should also be vaccinated.' },
      { badge: 'At risk', cls: 'badge-risk', name: 'Hepatitis A', body: '2-dose series for adults with risk factors: travel to endemic areas, chronic liver disease, men who have sex with men, injection drug use, or anyone wanting protection.' },
      { badge: 'If not immune', cls: 'badge-routine', name: 'MMR', body: 'Adults born in 1957 or later without evidence of immunity need at least 1 dose. Healthcare workers and international travelers may need 2 doses.' },
      { badge: 'If not immune', cls: 'badge-routine', name: 'Varicella', body: '2-dose series for adults without evidence of immunity to chickenpox. Doses given 4 to 8 weeks apart.' },
      { badge: '60+', cls: 'badge-age', name: 'RSV', body: 'Single dose of RSV vaccine for adults 75+, or adults 60-74 at increased risk. Shared clinical decision-making with healthcare provider.' },
    ];
    grid.innerHTML = items.map(function(i) {
      return '<div class="info-card"><div class="info-badge ' + i.cls + '">' + i.badge + '</div><h3 class="info-title">' + i.name + '</h3><p class="info-body">' + i.body + '</p></div>';
    }).join('');
  }

  /* -------- Build Pregnancy -------- */
  function buildPregnancy() {
    var grid = $('#pregGrid');
    if (!grid) return;
    var rec = [
      { name: 'Tdap', detail: 'One dose during each pregnancy, preferably during weeks 27 through 36 (early third trimester). Passes whooping cough antibodies to the baby before birth.' },
      { name: 'Influenza (Flu)', detail: 'Inactivated flu vaccine (IIV) is safe during any trimester. Protects both the mother and the newborn (who cannot be vaccinated until 6 months).' },
      { name: 'COVID-19', detail: 'Updated COVID-19 vaccine is recommended for pregnant individuals. Can be given at any point during pregnancy.' },
      { name: 'RSV (Abrysvo)', detail: 'Seasonal. Single dose during weeks 32 through 36 of pregnancy (September through January). Protects infant from severe RSV disease in their first months of life.' },
    ];
    var avoid = [
      { name: 'MMR', detail: 'Live vaccine. Get vaccinated at least 4 weeks before becoming pregnant if not immune.' },
      { name: 'Varicella', detail: 'Live vaccine. Complete the series before pregnancy. Wait at least 4 weeks after vaccination before conceiving.' },
      { name: 'LAIV (Nasal Flu Spray)', detail: 'Live vaccine. Use the inactivated injectable flu vaccine instead during pregnancy.' },
      { name: 'Shingrix', detail: 'Not recommended during pregnancy due to insufficient safety data. Defer until after delivery.' },
    ];
    function renderCol(title, items, cls) {
      var h = '<div class="preg-col ' + cls + '"><h3 class="preg-col-title">' + title + '</h3>';
      items.forEach(function(i) { h += '<div class="preg-item"><div class="preg-name">' + i.name + '</div><div class="preg-detail">' + i.detail + '</div></div>'; });
      return h + '</div>';
    }
    grid.innerHTML = renderCol('Recommended During Pregnancy', rec, 'preg-recommended') + renderCol('Avoid During Pregnancy', avoid, 'preg-avoid');
  }

  /* -------- Build Travel -------- */
  function buildTravel() {
    var grid = $('#travelGrid');
    if (!grid) return;
    var items = [
      { name: 'Hepatitis A', body: 'Transmitted through contaminated food/water. Recommended for most international travel destinations. 2-dose series.' },
      { name: 'Hepatitis B', body: 'Spread through blood and body fluids. Recommended for travelers who may have medical procedures, tattoos, or sexual contact abroad. 3-dose series.' },
      { name: 'Typhoid', body: 'Common in South Asia, Africa, and Latin America. Available as an oral (4-dose) or injectable (single dose) vaccine. Get vaccinated at least 2 weeks before travel.' },
      { name: 'Yellow Fever', body: 'Required for entry to certain countries in Africa and South America. Single dose provides lifelong protection. Must be given at an authorized vaccine center.' },
      { name: 'Japanese Encephalitis', body: 'Found in rural parts of Asia and the Western Pacific. 2-dose series completed at least 1 week before travel. Recommended for longer trips or rural stays.' },
      { name: 'Rabies', body: 'Risk in many developing countries, especially with animal contact. Pre-exposure 2-dose series. Critical for adventure travelers, veterinary workers, and long-term stays.' },
      { name: 'Cholera', body: 'Risk in areas with unsafe water and sanitation. Single-dose oral vaccine (Vaxchora) for adults 2-64. Take at least 10 days before travel.' },
      { name: 'Meningococcal', body: 'Required for travel to the "meningitis belt" of sub-Saharan Africa and for Hajj pilgrimage. MenACWY vaccine recommended.' },
      { name: 'Polio', body: 'Adult booster (IPV) recommended for travel to countries with active poliovirus circulation. One lifetime booster dose if previously vaccinated.' },
      { name: 'Tick-borne Encephalitis', body: 'Risk in forested areas of Europe and Asia. 3-dose series. Recommended for outdoor enthusiasts, hikers, and campers traveling to endemic regions.' },
    ];
    grid.innerHTML = items.map(function(i) {
      return '<div class="info-card travel-card"><h3 class="info-title">' + i.name + '</h3><p class="info-body">' + i.body + '</p></div>';
    }).join('');
  }

  /* -------- Build Mpox -------- */
  function buildMpox() {
    var grid = $('#mpoxGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="mpox-block"><h3 class="mpox-heading">Vaccine: JYNNEOS</h3><p>Live, attenuated, non-replicating orthopoxvirus vaccine. Approved for prevention of both monkeypox and smallpox. Commercially available in the U.S. since April 2024.</p></div>'
    + '<div class="mpox-block"><h3 class="mpox-heading">Schedule</h3><div class="mpox-schedule"><div class="mpox-dose"><span class="mpox-dose-num">Dose 1</span><span class="mpox-dose-detail">0.5 mL subcutaneous</span></div><div class="mpox-arrow"><span>28 days</span></div><div class="mpox-dose"><span class="mpox-dose-num">Dose 2</span><span class="mpox-dose-detail">0.5 mL subcutaneous</span></div></div><p style="margin-top:12px;font-size:13px;color:var(--text-secondary);">Alternative intradermal regimen (0.1 mL) is available for adults 18+ under EUA. Regimens are interchangeable between doses.</p></div>'
    + '<div class="mpox-block"><h3 class="mpox-heading">Who Should Get Vaccinated</h3><ul class="mpox-list"><li>Gay, bisexual, and other men who have sex with men, transgender or nonbinary people with recent sexual risk factors</li><li>Sexual partners of the above</li><li>People who anticipate the above risk factors</li><li>Research lab personnel working with orthopoxviruses</li><li>Travelers to affected countries with anticipated sexual contact risk</li></ul><p style="margin-top:8px;font-size:13px;color:var(--text-secondary);">Routine vaccination is <strong>not</strong> recommended for the general public or healthcare personnel unless sexual risk factors are present.</p></div>'
    + '<div class="mpox-block"><h3 class="mpox-heading">Effectiveness</h3><div class="mpox-stats"><div class="mpox-stat"><span class="mpox-stat-num">75%</span><span class="mpox-stat-label">After 1 dose</span></div><div class="mpox-stat"><span class="mpox-stat-num">86%</span><span class="mpox-stat-label">After 2 doses</span></div></div><p style="margin-top:12px;font-size:13px;color:var(--text-secondary);">Breakthrough infections after 2 doses are rare (&lt;1%) and typically milder. Peak immunity reached 14 days after dose 2. Protection does not appear to wane for at least 5 years.</p></div>'
    + '<div class="mpox-block"><h3 class="mpox-heading">Post-Exposure Prophylaxis</h3><p>Can be given after known or presumed exposure. Ideally within <strong>4 days</strong> of exposure. Administration 4 to 14 days after exposure may still provide some protection. No boosters recommended for the general population at this time.</p></div>'
    + '<div class="mpox-block"><h3 class="mpox-heading">Special Populations</h3><ul class="mpox-list"><li><strong>Under 18:</strong> Available under EUA, subcutaneous only</li><li><strong>Pregnant/breastfeeding:</strong> Can be offered with shared clinical decision-making</li><li><strong>Immunocompromised:</strong> Administer 0.5 mL subcutaneous (standard 2-dose series)</li><li><strong>Prior smallpox vaccination:</strong> Still recommended; prior immunity may not be lifelong</li></ul></div>';
  }

  /* -------- Init -------- */
  function init() {
    buildTable();
    setupAgeFilter();
    setupCatchupTabs();
    buildTimeline();
    buildCards();
    buildAdult();
    buildPregnancy();
    buildTravel();
    buildMpox();
    setupModal();
    setupNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
