#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_REQUIRED_CONTEXT_FILES = [
  'docs/QA_GOD_FIX_QUEUE_2026-02-17.md',
  'docs/WEBSITE_REVIEW_2026-02-17.md',
  'docs/PEDS_GTM_PLAN_2026-02-17.md'
];

const DEFAULT_OPTIONAL_CONTEXT_FILES = [
  'docs/QA_GOD_ORCHESTRATOR_REPORT_2026-02-17.md',
  'docs/QA_GOD_GATE_MATRIX_2026-02-17.json',
  'docs/QA_GOD_EVIDENCE_2026-02-17.md',
  'docs/PEDS_EXECUTION_BACKLOG_2026-02-17.md',
  'docs/PEDS_PRODUCT_ROADMAP_2026-02-17.md',
  'docs/PEDS_STRATEGY_REPORT_2026-02-17.md'
];

const SEVERITY_RANK = { blocker: 3, major: 2, minor: 1 };
const SEVERITY_WEIGHT = { blocker: 70, major: 40, minor: 20 };
const WAVE_ORDER = ['wave_0', 'wave_1', 'wave_2', 'wave_3'];
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'or', 'the', 'to', 'for', 'of', 'in', 'on', 'with', 'by', 'at',
  'is', 'are', 'be', 'as', 'from', 'that', 'this', 'should', 'can', 'into', 'before',
  'after', 'add', 'use', 'using', 'only', 'not', 'if', 'it', 'all', 'any', 'plus'
]);

const OWNER_CHOICES = new Set(['logic', 'analytics', 'legal', 'ops', 'frontend', 'content', 'seo', 'cross']);
const DOMAIN_CHOICES = new Set(['medical', 'technical', 'legal', 'ops', 'product']);

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function slugify(value, maxLen = 80) {
  return normalizeSpace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);
}

function stableHash(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex').slice(0, 10);
}

function uniqSorted(values) {
  return Array.from(new Set((values || []).filter(Boolean))).sort();
}

function toRelativePath(repoRoot, absPath) {
  return path.relative(repoRoot, absPath).replace(/\\/g, '/');
}

function severityFromText(value, fallback = 'major') {
  const v = normalizeSpace(value).toLowerCase();
  if (v.includes('blocker') || v.includes('critical')) return 'blocker';
  if (v.includes('major') || v.includes('high')) return 'major';
  if (v.includes('minor') || v.includes('medium') || v.includes('low')) return 'minor';
  return fallback;
}

function ownerFromText(value, fallback = 'cross') {
  const v = normalizeSpace(value).toLowerCase();
  if (OWNER_CHOICES.has(v)) return v;
  if (v.includes('logic') || v.includes('medical')) return 'logic';
  if (v.includes('analytic') || v.includes('tracking') || v.includes('telemetry')) return 'analytics';
  if (v.includes('legal') || v.includes('privacy') || v.includes('policy')) return 'legal';
  if (v.includes('ops') || v.includes('deploy') || v.includes('cache') || v.includes('infra')) return 'ops';
  if (v.includes('front') || v.includes('ui') || v.includes('ux')) return 'frontend';
  if (v.includes('seo')) return 'seo';
  if (v.includes('content') || v.includes('copy')) return 'content';
  return fallback;
}

function inferDomains(text, seed = []) {
  const out = new Set((seed || []).filter((d) => DOMAIN_CHOICES.has(d)));
  const v = normalizeSpace(text).toLowerCase();

  if (/medical|dose|dosing|vaccine|vaccin|growth|bilirubin|ga |gestational|clinical|catch-up|catchup/.test(v)) out.add('medical');
  if (/technical|runtime|service worker|cache|code|lint|test|qa|js|json|schema|manifest/.test(v)) out.add('technical');
  if (/legal|privacy|consent|dnt|policy|compliance|claims/.test(v)) out.add('legal');
  if (/ops|deploy|wrangler|header|csp|hsts|pipeline|release|environment|config/.test(v)) out.add('ops');
  if (/product|positioning|seo|metadata|sitemap|content|messaging|gtm/.test(v)) out.add('product');

  return Array.from(out).sort();
}

function tokenize(value) {
  return normalizeSpace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function mergeSeverity(a, b) {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function canonicalGate(gateId) {
  const gate = normalizeSpace(gateId);
  if (!gate) return '';
  if (/^G-[A-Z]+-\d+$/i.test(gate)) return gate.toUpperCase();
  return gate;
}

async function readSource(repoRoot, relPath, required) {
  const abs = path.join(repoRoot, relPath);
  try {
    const content = await fs.readFile(abs, 'utf8');
    return {
      id: slugify(relPath, 120),
      path: relPath,
      type: path.extname(relPath).replace('.', '') || 'txt',
      required,
      exists: true,
      content,
      loaded_at: new Date().toISOString(),
      hash: stableHash(content)
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return {
        id: slugify(relPath, 120),
        path: relPath,
        type: path.extname(relPath).replace('.', '') || 'txt',
        required,
        exists: false,
        content: '',
        loaded_at: new Date().toISOString(),
        hash: ''
      };
    }
    throw error;
  }
}

export function parseQaFixQueue(markdown, sourcePath = 'docs/QA_GOD_FIX_QUEUE_2026-02-17.md') {
  const lines = String(markdown || '').split('\n');
  const out = [];
  let seenHeader = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!seenHeader && /^\|\s*Priority\s*\|\s*Gate\s*\|/i.test(line)) {
      seenHeader = true;
      continue;
    }
    if (!seenHeader || !line.trim().startsWith('|')) continue;
    if (/^\|\s*-+/.test(line)) continue;

    const cells = line.split('|').slice(1, -1).map((part) => normalizeSpace(part));
    if (cells.length < 6) continue;
    if (!/^\d+$/.test(cells[0])) continue;

    const gate = canonicalGate(cells[1]);
    const severity = severityFromText(cells[2], 'major');
    const owner = ownerFromText(cells[3], 'cross');
    const actionText = cells[4];
    const acceptance = cells[5];
    const title = actionText;

    out.push({
      source: 'qa_fix_queue',
      source_path: sourcePath,
      source_line: i + 1,
      gate_id: gate,
      gate_label: gate,
      title,
      severity,
      owner,
      domains: inferDomains(`${cells[1]} ${cells[2]} ${cells[3]} ${title} ${acceptance}`),
      acceptance_criteria: acceptance ? [acceptance] : [],
      risk_summary: title,
      source_refs: [`${sourcePath}:${i + 1}`],
      evidence_refs: [],
      priority_hint: Number(cells[0])
    });
  }

  return out;
}

export function parseWebsiteReview(markdown, sourcePath = 'docs/WEBSITE_REVIEW_2026-02-17.md') {
  const lines = String(markdown || '').split('\n');
  const out = [];
  let sectionSeverity = 'major';

  function severityForSection(text) {
    const v = normalizeSpace(text).toLowerCase();
    if (v.includes('critical')) return 'blocker';
    if (v.includes('high')) return 'major';
    if (v.includes('medium') || v.includes('low')) return 'minor';
    return sectionSeverity;
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^##\s+/.test(line)) {
      sectionSeverity = severityForSection(line.replace(/^##\s+/, ''));
      i += 1;
      continue;
    }

    const findingMatch = line.match(/^\s*(\d+)\.\s+((?:\[[^\]]+\])+?)\s*(.+)$/);
    if (!findingMatch) {
      i += 1;
      continue;
    }

    const bracketParts = Array.from(findingMatch[2].matchAll(/\[([^\]]+)\]/g)).map((m) => normalizeSpace(m[1]));
    const gateBracket = bracketParts.find((part) => /^Gate\s+\d+/i.test(part)) || '';
    const gateNumber = (gateBracket.match(/(\d+)/) || [])[1];
    const gateLabel = gateNumber ? `Gate ${String(gateNumber).padStart(2, '0')}` : gateBracket;
    const tags = bracketParts.filter((part) => !/^Gate\s+\d+/i.test(part));

    const description = normalizeSpace(findingMatch[3]);
    let evidenceRefs = [];
    let block = description;
    let j = i + 1;
    while (j < lines.length && !/^\s*\d+\.\s+\[/.test(lines[j]) && !/^##\s+/.test(lines[j])) {
      const row = normalizeSpace(lines[j]);
      if (row) block += ` ${row}`;
      if (/^Evidence:/i.test(row)) {
        evidenceRefs = row
          .replace(/^Evidence:\s*/i, '')
          .split(',')
          .map((part) => normalizeSpace(part))
          .filter(Boolean);
      }
      j += 1;
    }

    const inferredOwner = ownerFromText(`${tags.join(' ')} ${description}`, 'cross');
    const domains = inferDomains(`${tags.join(' ')} ${description}`, tags.map((t) => {
      const n = t.toLowerCase();
      if (n.includes('medical')) return 'medical';
      if (n.includes('technical')) return 'technical';
      if (n.includes('legal')) return 'legal';
      if (n.includes('ops')) return 'ops';
      return 'product';
    }));

    out.push({
      source: 'website_review',
      source_path: sourcePath,
      source_line: i + 1,
      gate_id: gateLabel,
      gate_label: gateLabel,
      title: description,
      severity: sectionSeverity,
      owner: inferredOwner,
      domains,
      acceptance_criteria: [],
      risk_summary: block,
      source_refs: [`${sourcePath}:${i + 1}`],
      evidence_refs: evidenceRefs,
      priority_hint: Number(findingMatch[1]) || 999
    });

    i = j;
  }

  return out;
}

export function parseGtmPlan(markdown) {
  const lines = String(markdown || '').split('\n');
  const bullets = lines
    .map((line) => normalizeSpace(line))
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, '').trim())
    .filter(Boolean);

  const phrases = uniqSorted(bullets);
  const keywordSet = new Set();

  phrases.forEach((phrase) => {
    tokenize(phrase).forEach((token) => {
      keywordSet.add(token);
    });
  });

  return {
    phrases,
    keywords: Array.from(keywordSet).sort()
  };
}

function dedupeAndMerge(candidates) {
  const groups = [];

  for (const item of candidates) {
    const itemTokens = tokenize(item.title);
    const canonical = canonicalGate(item.gate_id);

    let target = null;
    if (canonical && /^G-[A-Z]+-\d+$/i.test(canonical)) {
      target = groups.find((g) => g.gates.includes(canonical));
    }

    if (!target) {
      target = groups.find((g) => {
        const sim = jaccard(itemTokens, g.title_tokens);
        if (sim < 0.58) return false;
        if (g.owner === item.owner) return true;
        const overlap = g.domains.filter((d) => item.domains.includes(d));
        return overlap.length > 0;
      });
    }

    if (!target) {
      groups.push({
        title: item.title,
        title_tokens: itemTokens,
        severity: item.severity,
        owner: item.owner,
        domains: uniqSorted(item.domains),
        acceptance_criteria: uniqSorted(item.acceptance_criteria),
        risk_summary: item.risk_summary,
        source_refs: uniqSorted(item.source_refs),
        evidence_refs: uniqSorted(item.evidence_refs),
        gates: uniqSorted([item.gate_label || item.gate_id].filter(Boolean)),
        preferred_gate: /^G-[A-Z]+-\d+$/i.test(canonical) ? canonical : '',
        source_set: uniqSorted([item.source]),
        priority_hint: Number.isFinite(item.priority_hint) ? item.priority_hint : 999,
        merge_notes: []
      });
      continue;
    }

    target.severity = mergeSeverity(target.severity, item.severity);
    if (target.owner === 'cross' && item.owner !== 'cross') target.owner = item.owner;
    if (!target.preferred_gate && /^G-[A-Z]+-\d+$/i.test(canonical)) target.preferred_gate = canonical;

    target.domains = uniqSorted(target.domains.concat(item.domains));
    target.acceptance_criteria = uniqSorted(target.acceptance_criteria.concat(item.acceptance_criteria));
    target.source_refs = uniqSorted(target.source_refs.concat(item.source_refs));
    target.evidence_refs = uniqSorted(target.evidence_refs.concat(item.evidence_refs));
    target.gates = uniqSorted(target.gates.concat([item.gate_label || item.gate_id].filter(Boolean)));
    target.source_set = uniqSorted(target.source_set.concat(item.source));
    target.priority_hint = Math.min(target.priority_hint, Number.isFinite(item.priority_hint) ? item.priority_hint : 999);

    if (item.risk_summary && item.risk_summary.length > target.risk_summary.length) {
      target.risk_summary = item.risk_summary;
    }

    target.merge_notes.push(`merged:${item.source}:${item.source_line}`);
  }

  return groups;
}

function gtmAlignmentForAction(action, gtmSignals) {
  const text = normalizeSpace(
    `${action.title} ${action.acceptance_criteria.join(' ')} ${action.domains.join(' ')} ${action.risk_summary}`
  ).toLowerCase();

  let phraseHits = 0;
  for (const phrase of gtmSignals.phrases) {
    const p = normalizeSpace(phrase).toLowerCase();
    if (!p || p.length < 4) continue;
    if (text.includes(p)) phraseHits += 1;
    if (phraseHits >= 2) break;
  }

  let keywordHits = 0;
  for (const token of tokenize(text)) {
    if (gtmSignals.keywords.includes(token)) keywordHits += 1;
    if (keywordHits >= 4) break;
  }

  if (phraseHits >= 1 || keywordHits >= 3) return 'high';
  if (keywordHits >= 1) return 'medium';
  return 'low';
}

function computePriority(action) {
  let score = SEVERITY_WEIGHT[action.severity] || 20;

  if (action.domains.includes('medical') && action.domains.includes('legal')) score += 15;

  const coreText = `${action.title} ${action.risk_summary}`.toLowerCase();
  if (/catch-up|catchup|dosing|growth|bilirubin|ga\b|gestational/.test(coreText)) score += 10;
  if (action.gtm_alignment === 'high') score += 10;

  const evidenceCount = action.source_refs.length + action.evidence_refs.length;
  if (evidenceCount >= 3) score += 5;

  return Math.min(100, score);
}

function assignWave(action) {
  if (action.severity === 'blocker') return 'wave_0';
  if (action.severity === 'major' && (action.domains.includes('medical') || action.domains.includes('legal'))) return 'wave_1';
  if (action.severity === 'major') return 'wave_2';
  return 'wave_3';
}

function buildDependencies(actions) {
  const byId = new Map(actions.map((a) => [a.action_id, a]));

  const governanceIds = actions
    .filter((a) => a.domains.includes('legal') && /consent|policy|privacy|legal language|align|harmonize/.test(a.title.toLowerCase()))
    .map((a) => a.action_id);

  const dataModelIds = actions
    .filter((a) => /capture|validation|pipeline|model|input|date-aware|persist context|threshold/.test(a.title.toLowerCase()))
    .map((a) => a.action_id);

  const infraIds = actions
    .filter((a) => /deploy|cache|service worker|manifest|config|headers|csp|hsts|hash|wrangler/.test(a.title.toLowerCase()))
    .map((a) => a.action_id);

  actions.forEach((action) => {
    const deps = new Set(action.dependencies || []);
    const text = `${action.title} ${action.risk_summary}`.toLowerCase();

    if (/analytics|tracking|telemetry|measurement|dnt|geolocation/.test(text)) {
      governanceIds.forEach((dep) => { if (dep !== action.action_id) deps.add(dep); });
    }

    if (/copy|metadata|sitemap|claims|messaging|language/.test(text) || action.owner === 'content' || action.owner === 'seo') {
      dataModelIds.forEach((dep) => { if (dep !== action.action_id) deps.add(dep); });
      infraIds.forEach((dep) => { if (dep !== action.action_id) deps.add(dep); });
    }

    if ((action.owner === 'frontend' || action.owner === 'logic') && /ui|render|display|nav|chart/.test(text)) {
      dataModelIds.forEach((dep) => { if (dep !== action.action_id) deps.add(dep); });
    }

    action.dependencies = Array.from(deps).filter((dep) => byId.has(dep)).sort();
  });
}

function buildActionId(action) {
  const gateSlug = action.preferred_gate ? slugify(action.preferred_gate, 32) : '';
  const titleSlug = slugify(action.title, 42) || 'untitled-action';
  if (gateSlug) return `action-${gateSlug}-${titleSlug}`;
  return `action-${stableHash(action.title + action.source_refs.join('|'))}-${titleSlug}`;
}

function finalizeActions(groups, gtmSignals) {
  const actions = groups.map((g) => {
    const base = {
      action_id: '',
      title: g.title,
      source_refs: uniqSorted(g.source_refs.concat(g.evidence_refs)),
      evidence_refs: uniqSorted(g.evidence_refs),
      owner: g.owner,
      severity: g.severity,
      priority_score: 0,
      acceptance_criteria: g.acceptance_criteria,
      risk_summary: normalizeSpace(g.risk_summary || g.title),
      dependencies: [],
      gates: uniqSorted(g.gates),
      domains: uniqSorted(g.domains),
      gtm_alignment: 'low',
      wave: 'wave_3',
      status: 'proposed',
      source_set: g.source_set,
      preferred_gate: g.preferred_gate,
      merge_notes: g.merge_notes
    };

    base.gtm_alignment = gtmAlignmentForAction(base, gtmSignals);
    base.priority_score = computePriority(base);
    base.wave = assignWave(base);
    base.action_id = buildActionId(base);

    return base;
  });

  buildDependencies(actions);

  return actions
    .sort((a, b) => {
      if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
      if (SEVERITY_RANK[b.severity] !== SEVERITY_RANK[a.severity]) return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      return a.action_id.localeCompare(b.action_id);
    })
    .map((a) => ({ ...a, dependencies: uniqSorted(a.dependencies) }));
}

function waveDefinitions() {
  return {
    wave_0: {
      goal: 'Blocker risk containment and release-safety preconditions',
      entry_criteria: ['Backlog normalized', 'Blocker actions identified'],
      exit_criteria: ['All blocker acceptance criteria passed', 'No unresolved blocker dependencies']
    },
    wave_1: {
      goal: 'Major medical/legal correctness and contradiction removal',
      entry_criteria: ['Wave 0 complete or explicitly waived'],
      exit_criteria: ['Major medical/legal actions meet acceptance criteria']
    },
    wave_2: {
      goal: 'Remaining major technical/ops hardening',
      entry_criteria: ['Wave 1 complete'],
      exit_criteria: ['Infrastructure and runtime major gates satisfied']
    },
    wave_3: {
      goal: 'Minor governance, SEO, and process stabilization',
      entry_criteria: ['Major waves complete'],
      exit_criteria: ['Minor actions triaged and scheduled with owners']
    }
  };
}

function buildWavePlan(actions) {
  const defs = waveDefinitions();
  return WAVE_ORDER.map((waveId) => {
    const items = actions.filter((a) => a.wave === waveId);
    const ownerLoad = {};
    items.forEach((item) => {
      ownerLoad[item.owner] = (ownerLoad[item.owner] || 0) + 1;
    });

    return {
      wave_id: waveId,
      goal: defs[waveId].goal,
      entry_criteria: defs[waveId].entry_criteria,
      exit_criteria: defs[waveId].exit_criteria,
      items: items.map((item) => item.action_id),
      owner_load: ownerLoad
    };
  });
}

function summarizePriorities(actions) {
  const out = {
    by_severity: { blocker: 0, major: 0, minor: 0 },
    by_wave: { wave_0: 0, wave_1: 0, wave_2: 0, wave_3: 0 }
  };

  actions.forEach((a) => {
    out.by_severity[a.severity] = (out.by_severity[a.severity] || 0) + 1;
    out.by_wave[a.wave] = (out.by_wave[a.wave] || 0) + 1;
  });

  return out;
}

function topDependencyNodes(actions, limit = 10) {
  return [...actions]
    .sort((a, b) => {
      if (b.dependencies.length !== a.dependencies.length) return b.dependencies.length - a.dependencies.length;
      return a.action_id.localeCompare(b.action_id);
    })
    .slice(0, limit);
}

function renderReport({ outDate, sources, warnings, actions, waves }) {
  const summary = summarizePriorities(actions);
  const top10 = actions.slice(0, 10);
  const depTop = topDependencyNodes(actions, 10);

  const lines = [];
  lines.push(`# Meta Action Plan Report (${outDate})`);
  lines.push('');
  lines.push('## Source Coverage');
  lines.push('');
  sources.forEach((s) => {
    lines.push(`- ${s.path} (${s.required ? 'required' : 'optional'}): ${s.exists ? 'loaded' : 'missing'}`);
  });
  lines.push('');
  lines.push('## Parse Warnings');
  lines.push('');
  if (warnings.length === 0) lines.push('- none');
  warnings.forEach((w) => lines.push(`- ${w}`));
  lines.push('');
  lines.push('## Priority Distribution');
  lines.push('');
  lines.push(`- Blocker: ${summary.by_severity.blocker}`);
  lines.push(`- Major: ${summary.by_severity.major}`);
  lines.push(`- Minor: ${summary.by_severity.minor}`);
  lines.push(`- Wave 0: ${summary.by_wave.wave_0}`);
  lines.push(`- Wave 1: ${summary.by_wave.wave_1}`);
  lines.push(`- Wave 2: ${summary.by_wave.wave_2}`);
  lines.push(`- Wave 3: ${summary.by_wave.wave_3}`);
  lines.push('');
  lines.push('## Top 10 Actions');
  lines.push('');
  top10.forEach((a, idx) => {
    const rationale = [
      `severity=${a.severity}`,
      `gtm=${a.gtm_alignment}`,
      `domains=${a.domains.join('/') || 'none'}`,
      `refs=${a.source_refs.length}`
    ].join('; ');
    lines.push(`${idx + 1}. ${a.action_id}`);
    lines.push(`   - title: ${a.title}`);
    lines.push(`   - owner: ${a.owner} | wave: ${a.wave} | score: ${a.priority_score}`);
    lines.push(`   - rationale: ${rationale}`);
  });
  lines.push('');
  lines.push('## Dependency Graph Summary');
  lines.push('');
  const edgeCount = actions.reduce((sum, a) => sum + a.dependencies.length, 0);
  lines.push(`- total actions: ${actions.length}`);
  lines.push(`- total dependency edges: ${edgeCount}`);
  depTop.forEach((a) => {
    lines.push(`- ${a.action_id}: ${a.dependencies.length} dependencies`);
  });
  lines.push('');
  lines.push('## Wave Plan');
  lines.push('');
  waves.forEach((wave) => {
    lines.push(`- ${wave.wave_id}: ${wave.goal} (${wave.items.length} items)`);
  });

  return `${lines.join('\n')}\n`;
}

function renderWavesDoc({ outDate, actions, waves }) {
  const byId = new Map(actions.map((a) => [a.action_id, a]));
  const lines = [];

  lines.push(`# Meta Action Plan Waves (${outDate})`);
  lines.push('');

  waves.forEach((wave) => {
    lines.push(`## ${wave.wave_id.toUpperCase()}`);
    lines.push('');
    lines.push(`- Goal: ${wave.goal}`);
    lines.push(`- Entry criteria: ${wave.entry_criteria.join('; ')}`);
    lines.push(`- Exit criteria: ${wave.exit_criteria.join('; ')}`);
    lines.push('- Owner load:');
    const owners = Object.keys(wave.owner_load).sort();
    if (owners.length === 0) {
      lines.push('  - none');
    } else {
      owners.forEach((owner) => lines.push(`  - ${owner}: ${wave.owner_load[owner]}`));
    }
    lines.push('');
    lines.push('### Items');
    lines.push('');
    if (wave.items.length === 0) {
      lines.push('- none');
    } else {
      wave.items.forEach((id, idx) => {
        const item = byId.get(id);
        if (!item) return;
        lines.push(`${idx + 1}. ${id}`);
        lines.push(`   - ${item.title}`);
        lines.push(`   - severity: ${item.severity}; score: ${item.priority_score}; owner: ${item.owner}`);
        lines.push(`   - acceptance: ${item.acceptance_criteria.length ? item.acceptance_criteria.join(' | ') : 'None provided; define in implementation task.'}`);
      });
    }
    lines.push('');
  });

  return `${lines.join('\n')}\n`;
}

function renderPromptDoc({ outDate, actions, waves }) {
  const lines = [];
  lines.push(`# Meta Action Plan Implementation Prompt (${outDate})`);
  lines.push('');
  lines.push('You are implementing TinyHumanMD remediation and growth work from a normalized action backlog.');
  lines.push('');
  lines.push('## Guardrails');
  lines.push('- Execute wave-by-wave in order (wave_0 -> wave_3).');
  lines.push('- Do not mutate outside the current wave scope unless resolving explicit dependencies.');
  lines.push('- Keep medical/legal claims aligned with actual runtime behavior.');
  lines.push('- For each action: implement code changes, tests, and acceptance evidence.');
  lines.push('');
  lines.push('## Required Pre-Merge Gates');
  lines.push('- Relevant unit/integration tests pass.');
  lines.push('- No blocker action is left partially implemented.');
  lines.push('- Release notes include changed claims, risk, and rollback notes.');
  lines.push('');

  waves.forEach((wave) => {
    lines.push(`## ${wave.wave_id.toUpperCase()} Execution`);
    lines.push(`Goal: ${wave.goal}`);
    lines.push('Actions:');
    if (wave.items.length === 0) {
      lines.push('- none');
    } else {
      wave.items.forEach((id) => {
        const item = actions.find((a) => a.action_id === id);
        if (!item) return;
        lines.push(`- ${id}: ${item.title}`);
      });
    }
    lines.push('');
  });

  return `${lines.join('\n')}\n`;
}

function renderEvidenceDoc({ outDate, actions }) {
  const lines = [];
  lines.push(`# Meta Action Plan Evidence (${outDate})`);
  lines.push('');

  actions.forEach((a) => {
    lines.push(`## ${a.action_id}`);
    lines.push(`- Title: ${a.title}`);
    lines.push(`- Gates: ${a.gates.join(', ') || 'none'}`);
    lines.push(`- Sources:`);
    if (a.source_refs.length === 0) {
      lines.push('  - none');
    } else {
      a.source_refs.forEach((ref) => lines.push(`  - ${ref}`));
    }
    lines.push('');
  });

  return `${lines.join('\n')}\n`;
}

function parseContextList(value) {
  if (!value) return [];
  return value.split(',').map((part) => normalizeSpace(part)).filter(Boolean);
}

function computeOptionalContextFiles(repoRoot, includeOptional) {
  if (!includeOptional) return [];
  return DEFAULT_OPTIONAL_CONTEXT_FILES.map((p) => toRelativePath(repoRoot, path.join(repoRoot, p)));
}

export async function runMetaActionPlan(userOptions = {}) {
  const repoRoot = userOptions.repoRoot || process.cwd();
  const docsDir = userOptions.docsDir || path.join(repoRoot, 'docs');
  const outDate = userOptions.outDate || process.env.META_PLAN_OUT_DATE || new Date().toISOString().slice(0, 10);
  const rounds = Math.max(1, Number(userOptions.rounds || process.env.META_PLAN_ROUNDS || 20));
  const strict = userOptions.strict ?? (process.env.META_PLAN_STRICT === '1');
  const includeOptional = userOptions.includeOptional ?? (process.env.META_PLAN_INCLUDE_OPTIONAL === '1');
  const writeOutputs = userOptions.writeOutputs ?? true;
  const outputDir = userOptions.outputDir || docsDir;

  const contextOverride = userOptions.contextFiles || parseContextList(process.env.META_PLAN_CONTEXT_FILES);
  const requiredPaths = contextOverride.length > 0 ? contextOverride : [...DEFAULT_REQUIRED_CONTEXT_FILES];
  const optionalPaths = userOptions.optionalContextFiles || computeOptionalContextFiles(repoRoot, includeOptional);

  const sources = [];
  for (const rel of requiredPaths) {
    sources.push(await readSource(repoRoot, rel, true));
  }
  for (const rel of optionalPaths) {
    if (requiredPaths.includes(rel)) continue;
    sources.push(await readSource(repoRoot, rel, false));
  }

  const warnings = [];
  const missingRequired = sources.filter((s) => s.required && !s.exists).map((s) => s.path);

  if (missingRequired.length > 0) {
    const msg = `Missing required context files: ${missingRequired.join(', ')}`;
    if (strict) throw new Error(msg);
    warnings.push(msg);
  }

  const qaSource = sources.find((s) => /QA_GOD_FIX_QUEUE/i.test(s.path));
  const reviewSource = sources.find((s) => /WEBSITE_REVIEW/i.test(s.path));
  const gtmSource = sources.find((s) => /PEDS_GTM_PLAN/i.test(s.path));

  const rawActions = [];
  if (qaSource && qaSource.exists) rawActions.push(...parseQaFixQueue(qaSource.content, qaSource.path));
  if (reviewSource && reviewSource.exists) rawActions.push(...parseWebsiteReview(reviewSource.content, reviewSource.path));

  if (rawActions.length === 0) {
    const msg = 'No actions parsed from required context files.';
    if (strict) throw new Error(msg);
    warnings.push(msg);
  }

  const gtmSignals = parseGtmPlan(gtmSource && gtmSource.exists ? gtmSource.content : '');

  let groups = [];
  let candidates = rawActions;
  for (let i = 0; i < rounds; i += 1) {
    const merged = dedupeAndMerge(candidates);
    if (i > 0 && merged.length === groups.length) {
      const prev = groups.map((g) => `${g.title}|${g.severity}|${g.owner}`).sort().join('||');
      const next = merged.map((g) => `${g.title}|${g.severity}|${g.owner}`).sort().join('||');
      groups = merged;
      if (prev === next) break;
    } else {
      groups = merged;
    }

    candidates = merged.map((g) => ({
      source: 'merged',
      source_path: g.source_refs[0] || 'merged',
      source_line: 1,
      gate_id: g.preferred_gate || g.gates[0] || '',
      gate_label: g.preferred_gate || g.gates[0] || '',
      title: g.title,
      severity: g.severity,
      owner: g.owner,
      domains: g.domains,
      acceptance_criteria: g.acceptance_criteria,
      risk_summary: g.risk_summary,
      source_refs: g.source_refs,
      evidence_refs: g.evidence_refs,
      priority_hint: g.priority_hint
    }));
  }

  const actions = finalizeActions(groups, gtmSignals);
  const waves = buildWavePlan(actions);

  const backlog = {
    generated_at: new Date().toISOString(),
    out_date: outDate,
    config: {
      strict,
      include_optional: includeOptional,
      rounds,
      required_context_files: requiredPaths,
      optional_context_files: optionalPaths
    },
    sources: sources.map((s) => ({
      id: s.id,
      path: s.path,
      type: s.type,
      required: s.required,
      exists: s.exists,
      loaded_at: s.loaded_at,
      hash: s.hash
    })),
    warnings,
    actions,
    waves
  };

  const reportText = renderReport({ outDate, sources, warnings, actions, waves });
  const wavesText = renderWavesDoc({ outDate, actions, waves });
  const promptText = renderPromptDoc({ outDate, actions, waves });
  const evidenceText = renderEvidenceDoc({ outDate, actions });

  const files = {
    report: path.join(outputDir, `META_ACTION_PLAN_REPORT_${outDate}.md`),
    backlog: path.join(outputDir, `META_ACTION_PLAN_BACKLOG_${outDate}.json`),
    waves: path.join(outputDir, `META_ACTION_PLAN_WAVES_${outDate}.md`),
    prompt: path.join(outputDir, `META_ACTION_PLAN_PROMPT_${outDate}.md`),
    evidence: path.join(outputDir, `META_ACTION_PLAN_EVIDENCE_${outDate}.md`)
  };

  if (writeOutputs) {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(files.report, reportText, 'utf8');
    await fs.writeFile(files.backlog, `${JSON.stringify(backlog, null, 2)}\n`, 'utf8');
    await fs.writeFile(files.waves, wavesText, 'utf8');
    await fs.writeFile(files.prompt, promptText, 'utf8');
    await fs.writeFile(files.evidence, evidenceText, 'utf8');
  }

  return { backlog, files, reportText, wavesText, promptText, evidenceText, actions, waves, warnings, sources };
}

async function runCli() {
  try {
    const result = await runMetaActionPlan();
    console.log(`Meta action plan orchestrator complete.`);
    console.log(`Actions: ${result.actions.length}`);
    console.log(`Report: ${toRelativePath(process.cwd(), result.files.report)}`);
    console.log(`Backlog: ${toRelativePath(process.cwd(), result.files.backlog)}`);
  } catch (error) {
    console.error(`[meta-action-plan-orchestrator] ${error && error.message ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
