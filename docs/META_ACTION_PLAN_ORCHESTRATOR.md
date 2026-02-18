# Meta Action Plan Orchestrator

## Purpose

`meta-action-plan-orchestrator` consolidates multiple planning/review context files into one deterministic execution backlog.

It is planner-only in v1:

1. Read context files (`QA fix queue`, `website review`, `GTM plan`)
2. Normalize and deduplicate action items
3. Score and prioritize work
4. Infer dependencies
5. Assign wave-based rollout (`wave_0` to `wave_3`)
6. Emit implementation-ready artifacts

## Commands

```bash
# default run (required context set)
npm run qa:meta:plan

# strict mode (fails if required context files are missing)
npm run qa:meta:plan:strict
```

## Environment Variables

- `META_PLAN_CONTEXT_FILES`: comma-separated override list for required context files
- `META_PLAN_INCLUDE_OPTIONAL=1`: include optional strategy/evidence context files if present
- `META_PLAN_STRICT=1`: fail on required source missing or parse hard failure
- `META_PLAN_ROUNDS`: adversarial normalization rounds (default `20`)
- `META_PLAN_OUT_DATE`: override output date stamp (`YYYY-MM-DD`)

## Canonical Required Inputs

- `docs/QA_GOD_FIX_QUEUE_2026-02-17.md`
- `docs/WEBSITE_REVIEW_2026-02-17.md`
- `docs/PEDS_GTM_PLAN_2026-02-17.md`

## Outputs

Generated in `docs/`:

- `META_ACTION_PLAN_REPORT_<YYYY-MM-DD>.md`
- `META_ACTION_PLAN_BACKLOG_<YYYY-MM-DD>.json`
- `META_ACTION_PLAN_WAVES_<YYYY-MM-DD>.md`
- `META_ACTION_PLAN_PROMPT_<YYYY-MM-DD>.md`
- `META_ACTION_PLAN_EVIDENCE_<YYYY-MM-DD>.md`

## Backlog Schema Highlights

Each normalized action includes:

- `action_id`
- `title`
- `owner`
- `severity`
- `priority_score`
- `acceptance_criteria[]`
- `dependencies[]`
- `gates[]`
- `domains[]`
- `gtm_alignment`
- `wave`
- `status`

## Notes

- No product code is changed by this orchestrator.
- Output ordering is deterministic for stable diffs.
- Use generated prompt and wave docs as implementation handoff for coding agents.
