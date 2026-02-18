# QA God Fix Queue

Date: 2026-02-17

| Priority | Gate | Severity | Owner | Action | Acceptance |
|---:|---|---|---|---|---|
| 1 | G-LEGAL-001 | blocker | analytics | Strip DOB/date fields from analytics events and retain only coarse, non-identifying derived categories. | Potentially identifying/date-sensitive clinical inputs should be excluded or strongly minimized from analytics payloads. |
| 2 | G-MED-001 | blocker | logic | Add per-dose date capture and validation pipeline before forecasting. | Catch-up planning should capture date-aware prior dose validity when claiming interval-sensitive planning. |
| 3 | G-OPS-001 | major | ops | Use explicit project separation and deploy commands without mutable config swaps. | Environment configs should clearly separate targets and avoid mutable swap-side effects. |
