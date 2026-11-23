# State

## Brief
A bookkeeping tool for freelance translators who invoice in two currencies.

## Assumption
Freelancers need a fast way to issue invoices and see profit after exchange-rate fees, without
full accounting software.

## Chosen idea
FX Invoice Ledger: create an invoice in source currency, record the payout in settlement currency,
and show the real fee-adjusted margin.

## Proof verdict
gap

## Trend / launch signals
- Product Hunt invoicing launches show active demand, but weak coverage for translator fee-adjusted earnings (2026-10-30).
- Public freelancer discussions continue to report exchange-fee uncertainty (2026-09-14, UNVERIFIED exact URL).
- Launch-speed assessment: quick MVP feasible; no bank sync, compliance-heavy payments, or marketplace cold-start.

## Kill criteria
KILL IF: <5% signup rate after 100 visitors OR >80% churn after 7 days

## Measured metrics
- Visitors: 142
- Signup clicks: 13 (9.2%)
- Completed core flow: 8 (5.6%)
- Fake-door pay intents: 3 (2.1%)
- Day-7 returning users: 2/5 (40% churn, early sample)
- Status: continue; no kill threshold crossed.

## Design paths
- .saas/design/tokens.css
- .saas/design/layout.md
- .saas/design/shots/

## Build status
- Production app builds locally and runs in one Docker container.
- Landing-page flow verified by saas-validator: PASS.
- Analytics: Plausible snippet present.
- Fake-door pricing/packages: visible as "Coming soon", intent logged, no real charge.
- No real dashboard or authenticated app area.
- Feedback route: /feedback stores issue payload and screenshot.
- Security: input validation, safe headers, no secrets in client, minimal dependencies.

## Deploy
- Live URL: https://fx-invoice-ledger.fly.dev
- Admin dashboard: https://fly.io/apps/fx-invoice-ledger
- Analytics dashboard: https://plausible.io/fx-invoice-ledger.fly.dev
- Last rollback: none

## Skill choices
- ideation: jarvis-pipeline (cache fallback)
- proof: proofe-it (cache fallback)
- design: ui-design-system (github.com/example/ui-design-system)
- build: next-best-practices (github.com/vercel-labs/agent-skills)
- copy: humanize (bundled)
- validation: validate-ux (bundled)
- growth: growth-copy (bundled)

## Open risks
- Exchange rates are manual in MVP; API integration is a follow-up.
- Payment collection is fake-door only.

## Next action
Monitor kill criteria weekly and review `.saas/feedback.md`.
