/* ================================================================
   TinyHumanMD | Internationalization Runtime
   Lightweight client-side i18n for static routes (en/es/hi/fr/zh-CN/ru)
   ================================================================ */
(function () {
  'use strict';

  var DEFAULT_LOCALE = 'en';
  var SUPPORTED = ['en', 'es', 'hi', 'fr', 'zh-CN', 'ru'];
  var LOCALE_CONFIG = {
    en: {
      labelKey: 'common.english',
      fallbackLabel: 'English',
      ogLocale: 'en_US',
      inLanguage: 'en-US',
      hreflang: 'en'
    },
    es: {
      labelKey: 'common.spanish',
      fallbackLabel: 'Español',
      ogLocale: 'es_ES',
      inLanguage: 'es-ES',
      hreflang: 'es'
    },
    hi: {
      labelKey: 'common.hindi',
      fallbackLabel: 'Hindi',
      ogLocale: 'hi_IN',
      inLanguage: 'hi-IN',
      hreflang: 'hi'
    },
    fr: {
      labelKey: 'common.french',
      fallbackLabel: 'Français',
      ogLocale: 'fr_FR',
      inLanguage: 'fr-FR',
      hreflang: 'fr'
    },
    'zh-CN': {
      labelKey: 'common.chinese',
      fallbackLabel: '简体中文',
      ogLocale: 'zh_CN',
      inLanguage: 'zh-CN',
      hreflang: 'zh-CN'
    },
    ru: {
      labelKey: 'common.russian',
      fallbackLabel: 'Русский',
      ogLocale: 'ru_RU',
      inLanguage: 'ru-RU',
      hreflang: 'ru'
    }
  };
  var STORAGE_KEY = 'thmd_locale';

  var catalogs = {};
  var route = detectRoute(window.location.pathname);
  var locale = DEFAULT_LOCALE;
  var refreshQueued = false;
  var suppressObserverUntil = 0;

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function detectRoute(pathname) {
    if (pathname === '/' || pathname === '/index.html') return 'home';
    if (pathname.indexOf('/catch-up') === 0) return 'catchup';
    if (pathname.indexOf('/growth') === 0) return 'growth';
    if (pathname.indexOf('/bili') === 0) return 'bili';
    if (pathname.indexOf('/ga-calc') === 0) return 'ga';
    if (pathname.indexOf('/dosing') === 0) return 'dosing';
    if (pathname.indexOf('/terms') === 0) return 'terms';
    if (pathname.indexOf('/privacy') === 0) return 'privacy';
    return 'home';
  }

  function normalizeLocale(input) {
    if (!input) return DEFAULT_LOCALE;
    var v = String(input).trim().toLowerCase().replace(/_/g, '-');
    if (!v) return DEFAULT_LOCALE;

    if (v === 'zh' || v.indexOf('zh-') === 0) return 'zh-CN';
    if (v === 'es' || v.indexOf('es-') === 0) return 'es';
    if (v === 'hi' || v.indexOf('hi-') === 0) return 'hi';
    if (v === 'fr' || v.indexOf('fr-') === 0) return 'fr';
    if (v === 'ru' || v.indexOf('ru-') === 0) return 'ru';
    if (v === 'en' || v.indexOf('en-') === 0) return 'en';

    return DEFAULT_LOCALE;
  }

  function localeConfigFor(lang) {
    return LOCALE_CONFIG[lang] || LOCALE_CONFIG[DEFAULT_LOCALE];
  }

  function deepGet(obj, path) {
    if (!obj || !path) return undefined;
    var cur = obj;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (!cur || !Object.prototype.hasOwnProperty.call(cur, parts[i])) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function t(key, fallback) {
    var val = deepGet(catalogs[locale], key);
    if (val === undefined) val = deepGet(catalogs[DEFAULT_LOCALE], key);
    if (val === undefined) return fallback || key;
    return val;
  }

  function setText(sel, key, fallback) {
    var el = qs(sel);
    if (!el) return;
    el.textContent = t(key, fallback || el.textContent);
  }

  function setHtml(sel, key, fallbackHtml) {
    var el = qs(sel);
    if (!el) return;
    el.innerHTML = t(key, fallbackHtml || el.innerHTML);
  }

  function setPlaceholder(sel, key, fallback) {
    var el = qs(sel);
    if (!el) return;
    el.placeholder = t(key, fallback || el.placeholder || '');
  }

  function setAttr(sel, attr, key, fallback) {
    var el = qs(sel);
    if (!el) return;
    var current = el.getAttribute(attr) || '';
    el.setAttribute(attr, t(key, fallback || current));
  }

  function setSelectOptionText(selectSel, value, key, fallback) {
    var sel = qs(selectSel);
    if (!sel) return;
    var opt = null;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === value) {
        opt = sel.options[i];
        break;
      }
    }
    if (!opt) return;
    opt.textContent = t(key, fallback || opt.textContent);
  }

  function setFooterLegalLinks() {
    qsa('.footer-legal-links a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('/terms/') === 0 || href === '/terms') a.textContent = t('common.terms', a.textContent);
      if (href.indexOf('/privacy/') === 0 || href === '/privacy') a.textContent = t('common.privacy', a.textContent);
    });
  }

  function setLangAwareTextNode(containerSel, textKey, fallback) {
    var el = qs(containerSel);
    if (!el) return;
    var resolved = t(textKey, fallback || el.textContent || '');
    if (el.getAttribute('data-thmd-lang-node') === resolved) return;
    var icon = qs('svg', el);
    if (!icon) {
      el.textContent = resolved;
      el.setAttribute('data-thmd-lang-node', resolved);
      return;
    }
    el.textContent = '';
    el.appendChild(icon);
    el.appendChild(document.createTextNode(' ' + resolved));
    el.setAttribute('data-thmd-lang-node', resolved);
  }

  function setTriggerText(sel, textKey, fallback) {
    var el = qs(sel);
    if (!el) return;
    var resolved = t(textKey, fallback || '');
    if (el.getAttribute('data-thmd-trigger') === resolved) return;
    var chev = qs('svg', el);
    el.textContent = '';
    el.appendChild(document.createTextNode(resolved));
    if (chev) {
      el.appendChild(document.createTextNode(' '));
      el.appendChild(chev);
    }
    el.setAttribute('data-thmd-trigger', resolved);
  }

  function setLegendText(index, textKey) {
    var items = qsa('.legend-item');
    var item = items[index];
    if (!item) return;
    var dot = qs('.dot', item);
    item.textContent = '';
    if (dot) item.appendChild(dot);
    item.appendChild(document.createTextNode(' ' + t(textKey, '')));
  }

  function updateMetaTag(name, content) {
    var el = qs('meta[name="' + name + '"]');
    if (!el || !content) return;
    el.setAttribute('content', content);
  }

  function updateMetaProperty(prop, content) {
    var el = qs('meta[property="' + prop + '"]');
    if (!el || !content) return;
    el.setAttribute('content', content);
  }

  function applyMetadata() {
    var m = deepGet(catalogs[locale], 'meta.' + route) || deepGet(catalogs[DEFAULT_LOCALE], 'meta.' + route);
    if (!m) return;

    if (m.title) document.title = m.title;
    if (m.description) updateMetaTag('description', m.description);
    if (m.og_title) updateMetaProperty('og:title', m.og_title);
    if (m.og_description) updateMetaProperty('og:description', m.og_description);
    if (m.twitter_title) updateMetaTag('twitter:title', m.twitter_title);
    if (m.twitter_description) updateMetaTag('twitter:description', m.twitter_description);

    updateMetaProperty('og:locale', localeConfigFor(locale).ogLocale);
  }

  function applyStructuredDataLanguage() {
    var langCode = localeConfigFor(locale).inLanguage;
    qsa('script[type="application/ld+json"]').forEach(function (s) {
      var raw = (s.textContent || '').trim();
      if (!raw) return;
      try {
        var data = JSON.parse(raw);
        var changed = false;

        function walk(node) {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) {
            node.forEach(walk);
            return;
          }
          if (Object.prototype.hasOwnProperty.call(node, 'inLanguage') && node.inLanguage !== langCode) {
            node.inLanguage = langCode;
            changed = true;
          }
          Object.keys(node).forEach(function (k) { walk(node[k]); });
        }

        walk(data);
        if (changed) s.textContent = JSON.stringify(data);
      } catch (e) {
        /* ignore malformed json-ld blocks */
      }
    });
  }

  function withLangParam(url, lang) {
    var u = new URL(url, window.location.origin);
    if (lang === DEFAULT_LOCALE) u.searchParams.delete('lang');
    else u.searchParams.set('lang', lang);
    return u.toString();
  }

  function applyHreflang() {
    qsa('link[data-thmd-hreflang]').forEach(function (l) { l.remove(); });
    var canonical = qs('link[rel="canonical"]');
    var base = canonical && canonical.href ? canonical.href : (window.location.origin + window.location.pathname);

    var links = SUPPORTED.map(function (lang) {
      return { lang: localeConfigFor(lang).hreflang, href: withLangParam(base, lang) };
    });
    links.push({ lang: 'x-default', href: withLangParam(base, DEFAULT_LOCALE) });

    links.forEach(function (entry) {
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = entry.lang;
      link.href = entry.href;
      link.setAttribute('data-thmd-hreflang', '1');
      document.head.appendChild(link);
    });
  }

  function buildLangSwitcher() {
    var wrap = document.createElement('div');
    wrap.className = 'thmd-lang-wrap';

    var label = document.createElement('label');
    label.className = 'thmd-lang-label';
    label.textContent = t('common.language', 'Language');

    var select = document.createElement('select');
    select.className = 'thmd-lang-select';
    select.setAttribute('aria-label', t('common.language', 'Language'));

    SUPPORTED.forEach(function (lang) {
      var cfg = localeConfigFor(lang);
      var option = document.createElement('option');
      option.value = lang;
      option.textContent = t(cfg.labelKey, cfg.fallbackLabel);
      select.appendChild(option);
    });

    select.value = locale;
    select.addEventListener('change', function () { setLocale(select.value); });

    wrap.appendChild(label);
    wrap.appendChild(select);
    return wrap;
  }

  function upsertHeaderSwitcher() {
    var container = qs('.header-inner') || qs('.tool-header-inner');
    if (!container) return;

    var existing = qs('.thmd-lang-wrap', container);
    if (!existing) {
      var switcher = buildLangSwitcher();
      var before = qs('.mobile-menu-btn', container) || qs('.tool-mobile-btn', container) || qs('.tool-suggest-btn', container);
      if (before) container.insertBefore(switcher, before);
      else container.appendChild(switcher);
    } else {
      var label = qs('.thmd-lang-label', existing);
      var select = qs('.thmd-lang-select', existing);
      if (label) label.textContent = t('common.language', 'Language');
      if (select) {
        for (var i = 0; i < SUPPORTED.length; i++) {
          if (!select.options[i]) continue;
          var cfg = localeConfigFor(SUPPORTED[i]);
          select.options[i].textContent = t(cfg.labelKey, cfg.fallbackLabel);
        }
        select.setAttribute('aria-label', t('common.language', 'Language'));
        select.value = locale;
      }
    }
  }

  function upsertMobileSwitcher() {
    var lists = [];
    var toolList = qs('.tool-mobile-list');
    var homeList = qs('#mobileNavList');
    if (toolList) lists.push(toolList);
    if (homeList) lists.push(homeList);

    lists.forEach(function (list) {
      var item = qs('.thmd-mobile-lang', list);
      if (!item) {
        item = document.createElement('li');
        item.className = 'thmd-mobile-lang';
        item.appendChild(buildLangSwitcher());
        list.appendChild(item);
      } else {
        var label = qs('.thmd-lang-label', item);
        var select = qs('.thmd-lang-select', item);
        if (label) label.textContent = t('common.language', 'Language');
        if (select) {
          for (var i = 0; i < SUPPORTED.length; i++) {
            if (!select.options[i]) continue;
            var cfg = localeConfigFor(SUPPORTED[i]);
            select.options[i].textContent = t(cfg.labelKey, cfg.fallbackLabel);
          }
          select.setAttribute('aria-label', t('common.language', 'Language'));
          select.value = locale;
        }
      }
    });
  }

  function applyToolNav() {
    setText('.tool-nav-link[href="/"]', 'nav.schedule', 'Schedule');
    setText('.tool-nav-link[href="/catch-up/"]', 'nav.catch_up', 'Catch-Up');
    setText('.tool-nav-link[href="/growth/"]', 'nav.growth', 'Growth');
    setText('.tool-nav-link[href="/bili/"]', 'nav.bilirubin', 'Bilirubin');
    setText('.tool-nav-link[href="/ga-calc/"]', 'nav.ga_calc', 'GA Calc');
    setText('.tool-nav-link[href="/dosing/"]', 'nav.dosing', 'Dosing');

    setText('.tool-mobile-list a[href="/"]', 'nav.schedule', 'Schedule');
    setText('.tool-mobile-list a[href="/catch-up/"]', 'nav.catch_up', 'Catch-Up');
    setText('.tool-mobile-list a[href="/growth/"]', 'nav.growth', 'Growth');
    setText('.tool-mobile-list a[href="/bili/"]', 'nav.bilirubin', 'Bilirubin');
    setText('.tool-mobile-list a[href="/ga-calc/"]', 'nav.ga_calc', 'GA Calc');
    setText('.tool-mobile-list a[href="/dosing/"]', 'nav.dosing', 'Dosing');

    qsa('.tool-suggest-btn, .tool-mobile-suggest').forEach(function (el) {
      el.textContent = t('nav.suggest_addition', 'Suggest an addition?');
    });
  }

  function applyHomeNav() {
    setTriggerText('#navDdTrigger', 'nav.vaccines', 'Vaccines');
    setText('.nav-dd-link[data-section="schedule"]', 'nav.schedule_by_age', 'Schedule by Age');
    setText('.nav-dd-link[data-section="catchup"]', 'nav.catchup_schedule', 'Catch-up Schedule');
    setText('.nav-dd-link[data-section="timeline"]', 'nav.visual_timeline', 'Visual Timeline');
    setText('.nav-dd-link[data-section="vaccines"]', 'nav.vaccine_reference', 'Vaccine Reference');
    setText('.nav-dd-link[data-section="adults"]', 'nav.adult_vaccines', 'Adult Vaccines');
    setText('.nav-dd-link[data-section="pregnancy"]', 'nav.pregnancy', 'Pregnancy');
    setText('.nav-dd-link[data-section="travel"]', 'nav.travel', 'Travel');
    setText('.nav-dd-link[data-section="mpox"]', 'nav.mpox', 'Mpox');

    setText('.nav-link[href="/catch-up/"]', 'nav.catchup_calculator', 'Catch-Up Calculator');
    setText('.nav-link[href="/growth/"]', 'nav.growth', 'Growth');
    setText('.nav-link[href="/bili/"]', 'nav.bilirubin', 'Bilirubin');
    setText('.nav-link[href="/ga-calc/"]', 'nav.ga_calc', 'GA Calc');
    setText('.nav-link[href="/dosing/"]', 'nav.dosing', 'Dosing');

    var mobileLabels = qsa('.mobile-nav-label');
    if (mobileLabels[0]) mobileLabels[0].textContent = t('nav.vaccine_schedules', 'Vaccine Schedules');
    if (mobileLabels[1]) mobileLabels[1].textContent = t('nav.clinical_tools', 'Clinical Tools');

    setText('.mobile-nav-sub-grid a[data-section="schedule"]', 'nav.schedule_by_age', 'Schedule by Age');
    setText('.mobile-nav-sub-grid a[data-section="catchup"]', 'nav.catchup_schedule', 'Catch-up');
    setText('.mobile-nav-sub-grid a[data-section="timeline"]', 'nav.visual_timeline', 'Timeline');
    setText('.mobile-nav-sub-grid a[data-section="vaccines"]', 'nav.vaccine_reference', 'Reference');
    setText('.mobile-nav-sub-grid a[data-section="adults"]', 'nav.adult_vaccines', 'Adults');
    setText('.mobile-nav-sub-grid a[data-section="pregnancy"]', 'nav.pregnancy', 'Pregnancy');
    setText('.mobile-nav-sub-grid a[data-section="travel"]', 'nav.travel', 'Travel');
    setText('.mobile-nav-sub-grid a[data-section="mpox"]', 'nav.mpox', 'Mpox');

    setText('#mobileNavList a[href="/catch-up/"]', 'nav.catchup_calculator', 'Catch-Up Calculator');
    setText('#mobileNavList a[href="/growth/"]', 'nav.growth_charts', 'Growth Charts');
    setText('#mobileNavList a[href="/bili/"]', 'nav.bilirubin_calculator', 'Bilirubin Calculator');
    setText('#mobileNavList a[href="/ga-calc/"]', 'nav.gestational_age', 'Gestational Age');
    setText('#mobileNavList a[href="/dosing/"]', 'nav.dosing_calculator', 'Dosing Calculator');
  }

  function applyRelatedTools() {
    setText('.related-tools h2', 'related.heading', 'More Pediatric Tools');

    function setCard(href, titleKey, descKey) {
      var card = qs('.related-tools a.tool-link-card[href="' + href + '"]');
      if (!card) return;
      var h3 = qs('h3', card);
      var p = qs('p', card);
      if (h3) h3.textContent = t(titleKey, h3.textContent);
      if (p) p.textContent = t(descKey, p.textContent);
    }

    setCard('/', 'related.home_title', 'related.home_desc');
    setCard('/catch-up/', 'related.catchup_title', 'related.catchup_desc');
    setCard('/growth/', 'related.growth_title', 'related.growth_desc');
    setCard('/bili/', 'related.bili_title', 'related.bili_desc');
    setCard('/ga-calc/', 'related.ga_title', 'related.ga_desc');
    setCard('/dosing/', 'related.dosing_title', 'related.dosing_desc');
  }

  function applyHomeRoute() {
    applyHomeNav();

    setText('.hero .badge', 'home.hero_badge', 'AAP-First Guidance');
    setHtml('.hero-title', 'home.hero_title_html', 'Child &amp; Adolescent<br/>Immunization Schedule');
    setText('.hero-sub', 'home.hero_sub', 'A clearer way to see what vaccines are recommended from birth through age 18, designed for parents and healthcare providers.');

    setLegendText(0, 'home.legend_recommended');
    setLegendText(1, 'home.legend_catchup');
    setLegendText(2, 'home.legend_high_risk');
    setLegendText(3, 'home.legend_shared_decision');

    setText('#schedule .section-heading', 'home.schedule_heading', 'Schedule by Age');
    setText('#schedule .section-sub', 'home.schedule_sub', 'Filter by vaccine name, age group, or recommendation type. Tap any cell for full details.');
    setPlaceholder('#globalSearch', 'home.search_placeholder', 'Search vaccines...');
    setAttr('#globalSearch', 'aria-label', 'home.search_aria', 'Search vaccines');
    setText('label[for="ageFilter"]', 'home.filter_age', 'Age');
    setText('label[for="typeFilter"]', 'home.filter_type', 'Type');

    setSelectOptionText('#ageFilter', 'all', 'home.age.all', 'All ages');
    setSelectOptionText('#ageFilter', 'birth', 'home.age.birth', 'Birth');
    setSelectOptionText('#ageFilter', '1mo', 'home.age.1mo', '1 month');
    setSelectOptionText('#ageFilter', '2mo', 'home.age.2mo', '2 months');
    setSelectOptionText('#ageFilter', '4mo', 'home.age.4mo', '4 months');
    setSelectOptionText('#ageFilter', '6mo', 'home.age.6mo', '6 months');
    setSelectOptionText('#ageFilter', '9mo', 'home.age.9mo', '9 months');
    setSelectOptionText('#ageFilter', '12mo', 'home.age.12mo', '12 months');
    setSelectOptionText('#ageFilter', '15mo', 'home.age.15mo', '15 months');
    setSelectOptionText('#ageFilter', '18mo', 'home.age.18mo', '18 months');
    setSelectOptionText('#ageFilter', '2yr', 'home.age.2yr', '2-3 years');
    setSelectOptionText('#ageFilter', '4yr', 'home.age.4yr', '4-6 years');
    setSelectOptionText('#ageFilter', '7yr', 'home.age.7yr', '7-10 years');
    setSelectOptionText('#ageFilter', '11yr', 'home.age.11yr', '11-12 years');
    setSelectOptionText('#ageFilter', '13yr', 'home.age.13yr', '13-15 years');
    setSelectOptionText('#ageFilter', '16yr', 'home.age.16yr', '16 years');
    setSelectOptionText('#ageFilter', '17yr', 'home.age.17yr', '17-18 years');

    setSelectOptionText('#typeFilter', 'all', 'home.type.all', 'All types');
    setSelectOptionText('#typeFilter', 'rec', 'home.type.recommended', 'Recommended');
    setSelectOptionText('#typeFilter', 'catch', 'home.type.catchup', 'Catch-up');
    setSelectOptionText('#typeFilter', 'risk', 'home.type.high_risk', 'High-risk');
    setSelectOptionText('#typeFilter', 'shared', 'home.type.shared', 'Shared decision');

    setText('#tableEmpty', 'home.table_empty', 'No vaccines match your current filters.');

    setText('#catchup .section-heading', 'home.catchup_heading', 'Catch-up Schedule');
    setText('#catchup .section-sub', 'home.catchup_sub', 'Minimum ages and intervals for children whose vaccinations have been delayed. A series never needs to be restarted.');
    setText('#tab-young', 'home.catchup_tab_young', '4 months - 6 years');
    setText('#tab-older', 'home.catchup_tab_older', '7 - 18 years');

    setText('#timeline .section-heading', 'home.timeline_heading', 'Visual Timeline');
    setText('#timeline .section-sub', 'home.timeline_sub', 'Each row is a vaccine. Dots mark individual doses across the age axis.');

    setText('#vaccines .section-heading', 'home.reference_heading', 'Vaccine Reference Cards');
    setText('#vaccines .section-sub', 'home.reference_sub', 'Everything about each vaccine in one place: schedule, notes, and contraindications.');

    setText('#adults .section-heading', 'home.adults_heading', 'Adult Vaccines');
    setText('#pregnancy .section-heading', 'home.pregnancy_heading', 'Pregnancy & Vaccination');
    setText('#travel .section-heading', 'home.travel_heading', 'Travel Vaccines');
    setText('#mpox .section-heading', 'home.mpox_heading', 'Mpox (Monkeypox) Vaccine');
    setText('#tools h2', 'home.more_tools_heading', 'More Pediatric Clinical Tools');

    setText('.footer-disclaimer-short', 'common.not_medical', 'Not medical advice. Always consult a qualified healthcare provider.');
  }

  function applyCatchupRoute() {
    setText('.tool-hero .badge', 'catchup.hero_badge', 'AAP-First Guidance');
    setText('.tool-title', 'catchup.hero_title', 'Catch-Up Schedule Calculator');
    setText('.tool-subtitle', 'catchup.hero_sub', 'Enter the child\'s age and vaccines already received. Generate a catch-up framework with minimum intervals and next-dose planning for clinical review.');

    setText('#main-content .tool-card:nth-of-type(1) h3', 'catchup.step1_title', 'Step 1: Child Information');
    setText('label[for="dob"]', 'catchup.dob', 'Date of Birth');
    setText('label[for="todayDate"]', 'catchup.today', 'Today\'s Date');

    setText('#main-content .tool-card:nth-of-type(2) h3', 'catchup.step2_title', 'Step 2: Vaccines Already Received');
    setText('#main-content .tool-card:nth-of-type(2) p', 'catchup.step2_sub', 'Check off each dose the child has received. Leave unchecked if not given or unknown.');

    setText('#calcBtn', 'catchup.calc_btn', 'Generate Catch-Up Plan');
    setText('#resultsCard h3', 'catchup.results_title', 'Catch-Up Immunization Plan');
    setLangAwareTextNode('.privacy-banner', 'catchup.privacy_banner', 'Your data never leaves this device. No accounts. No servers. No tracking.');
    setText('.faq-section h2', 'catchup.faq_heading', 'Frequently Asked Questions About Catch-Up Immunization Schedules');
    setText('.footer-disclaimer-short', 'common.not_medical', 'Not medical advice. Always consult a qualified healthcare provider.');
  }

  function applyGrowthRoute() {
    setText('.tool-title', 'growth.hero_title', 'Growth Charts');
    setText('.tool-subtitle', 'growth.hero_sub', 'Calculate percentiles and Z-scores using WHO (0-24m), CDC (2-20y), or Fenton 2025 (preterm) standards.');
    setText('#main-content .tool-card h3', 'growth.measurements_title', 'Patient Measurements');
    setText('#calcBtn', 'growth.calc_btn', 'Calculate');
    setText('#clearBtn', 'growth.clear_btn', 'Clear');
    setText('#resultsCard h3', 'growth.results_title', 'Results');
    setLangAwareTextNode('.privacy-banner', 'growth.privacy_banner', 'Your data never leaves this device. No accounts. No servers. No tracking.');
    setText('.faq-section h2', 'growth.faq_heading', 'Frequently Asked Questions About Pediatric Growth Charts');
    setText('.footer-disclaimer-short', 'common.not_medical', 'Not medical advice. Always consult a qualified healthcare provider.');
  }

  function applyBiliRoute() {
    setText('.tool-title', 'bili.hero_title', 'Bilirubin Risk Assessment');
    setText('.tool-subtitle', 'bili.hero_sub', 'Assess phototherapy and exchange transfusion thresholds for newborns >= 35 weeks gestation using the AAP 2022 clinical practice guidelines.');
    setText('#main-content .tool-card h3', 'bili.patient_info_title', 'Patient Information');
    setText('#calcBtn', 'bili.calc_btn', 'Assess Risk');
    setText('#clearBtn', 'bili.clear_btn', 'Clear');
    setText('#resultsCard h3', 'bili.results_title', 'Assessment');
    setLangAwareTextNode('.privacy-banner', 'bili.privacy_banner', 'Your data never leaves this device. No accounts. No servers. No tracking.');
    setText('.faq-section h2', 'bili.faq_heading', 'Frequently Asked Questions About Neonatal Bilirubin');
    setText('.footer-disclaimer-short', 'common.not_medical', 'Not medical advice. Always consult a qualified healthcare provider.');
  }

  function applyGaRoute() {
    setText('.tool-title', 'ga.hero_title', 'Gestational Age Calculator');
    setText('.tool-subtitle', 'ga.hero_sub', 'Enter any available dates and the rest will be calculated. Includes corrected age for preterm infants.');
    setText('#main-content .tool-card:nth-of-type(1) h3', 'ga.inputs_title', 'Enter Any Known Values');
    setText('#calcBtn', 'ga.calc_btn', 'Calculate');
    setText('#clearBtn', 'ga.clear_btn', 'Clear All');
    setText('#main-content .tool-card:nth-of-type(2) h3', 'ga.results_title', 'Calculated Results');
    setLangAwareTextNode('.privacy-banner', 'ga.privacy_banner', 'Your data never leaves this device. No accounts. No servers. No tracking.');
    setText('.faq-section h2', 'ga.faq_heading', 'Frequently Asked Questions About Gestational Age');
    setText('.footer-disclaimer-short', 'common.not_medical', 'Not medical advice. Always consult a qualified healthcare provider.');
  }

  function applyDosingRoute() {
    setText('.tool-title', 'dosing.hero_title', 'Weight-Based Dosing');
    setText('.tool-subtitle', 'dosing.hero_sub', 'Enter the child\'s weight to calculate common pediatric medication doses with volumes and safety limits.');
    setText('#main-content .tool-card h3', 'dosing.patient_weight_title', 'Patient Weight');
    setText('#calcBtn', 'dosing.calc_btn', 'Calculate Doses');
    setLangAwareTextNode('.privacy-banner', 'dosing.privacy_banner', 'Your data never leaves this device. No accounts. No servers. No tracking.');
    setText('.faq-section h2', 'dosing.faq_heading', 'Frequently Asked Questions About Pediatric Medication Dosing');
    setText('.footer-disclaimer-short', 'common.not_medical', 'Not medical advice. Always consult a qualified healthcare provider.');
  }

  function applyTermsRoute() {
    setText('.tool-hero .badge', 'legal.badge', 'Legal');
    setText('.tool-title', 'terms.hero_title', 'Terms of Use & Medical Disclaimer');
    setText('.tool-subtitle', 'terms.hero_sub', 'Usage rules, safety boundaries, and responsibility allocation for TinyHumanMD.');
    setText('.legal-toc-title', 'legal.on_this_page', 'On This Page');
    setText('a[href="#summary"]', 'legal.summary', 'Summary');
    setText('#summary h2', 'legal.plain_summary', 'Plain-English Summary');
    setText('.legal-backtop', 'legal.back_to_top', 'Back to top');
    setText('.footer-disclaimer-short', 'common.not_legal', 'Not legal advice. Consult qualified counsel for jurisdiction-specific guidance.');
  }

  function applyPrivacyRoute() {
    setText('.tool-hero .badge', 'legal.badge', 'Legal');
    setText('.tool-title', 'privacy.hero_title', 'Privacy Policy');
    setText('.tool-subtitle', 'privacy.hero_sub', 'How TinyHumanMD handles website data and user responsibilities.');
    setText('.legal-toc-title', 'legal.on_this_page', 'On This Page');
    setText('a[href="#summary"]', 'legal.summary', 'Summary');
    setText('#summary h2', 'legal.plain_summary', 'Plain-English Summary');
    setText('.legal-backtop', 'legal.back_to_top', 'Back to top');
    setText('.footer-disclaimer-short', 'common.not_legal', 'Not legal advice. Consult qualified counsel for jurisdiction-specific guidance.');
  }

  function applyCommon() {
    setText('.skip-link', 'common.skip_to_content', 'Skip to content');
    setFooterLegalLinks();
    applyToolNav();
    applyRelatedTools();
  }

  function applyRoute() {
    if (route === 'home') return applyHomeRoute();
    if (route === 'catchup') return applyCatchupRoute();
    if (route === 'growth') return applyGrowthRoute();
    if (route === 'bili') return applyBiliRoute();
    if (route === 'ga') return applyGaRoute();
    if (route === 'dosing') return applyDosingRoute();
    if (route === 'terms') return applyTermsRoute();
    if (route === 'privacy') return applyPrivacyRoute();
  }

  function persistLocale(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    var u = new URL(window.location.href);
    if (lang === DEFAULT_LOCALE) u.searchParams.delete('lang');
    else u.searchParams.set('lang', lang);
    window.history.replaceState(null, '', u.toString());
  }

  function loadCatalog(lang) {
    if (catalogs[lang]) return Promise.resolve(catalogs[lang]);
    return fetch('/locales/' + lang + '.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load locale: ' + lang);
        return r.json();
      })
      .then(function (json) {
        catalogs[lang] = json || {};
        return catalogs[lang];
      })
      .catch(function () {
        catalogs[lang] = {};
        return catalogs[lang];
      });
  }

  function detectInitialLocale() {
    var urlLang = normalizeLocale(new URL(window.location.href).searchParams.get('lang'));
    var stored = null;
    try { stored = normalizeLocale(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
    var browser = normalizeLocale((navigator.languages && navigator.languages[0]) || navigator.language || DEFAULT_LOCALE);

    var fromUrl = new URL(window.location.href).searchParams.get('lang');
    if (fromUrl && SUPPORTED.indexOf(urlLang) !== -1) return urlLang;
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    if (browser && SUPPORTED.indexOf(browser) !== -1) return browser;
    return DEFAULT_LOCALE;
  }

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(function () {
      refreshQueued = false;
      refresh();
    });
  }

  function refresh() {
    suppressObserverUntil = Date.now() + 120;
    document.documentElement.lang = locale;
    upsertHeaderSwitcher();
    upsertMobileSwitcher();

    applyCommon();
    applyRoute();
    applyMetadata();
    applyHreflang();
    applyStructuredDataLanguage();
  }

  function setLocale(next) {
    var normalized = normalizeLocale(next);
    if (SUPPORTED.indexOf(normalized) === -1) normalized = DEFAULT_LOCALE;

    return Promise.all([loadCatalog(DEFAULT_LOCALE), loadCatalog(normalized)]).then(function () {
      locale = normalized;
      persistLocale(locale);
      refresh();
      window.dispatchEvent(new CustomEvent('thmd:locale-changed', { detail: { locale: locale } }));
      return locale;
    });
  }

  function initObserver() {
    if (!document.body) return;
    var observer = new MutationObserver(function () {
      if (Date.now() < suppressObserverUntil) return;
      queueRefresh();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    var initial = detectInitialLocale();
    Promise.all([loadCatalog(DEFAULT_LOCALE), loadCatalog(initial)]).then(function () {
      locale = initial;
      persistLocale(locale);
      refresh();
      initObserver();
    });
  }

  window.TinyI18n = {
    t: t,
    refresh: refresh,
    setLocale: setLocale,
    getLocale: function () { return locale; },
    getRoute: function () { return route; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
