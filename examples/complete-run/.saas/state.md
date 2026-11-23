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
- App builds and starts locally.
- Core flow verified by saas-validator: PASS.
- Analytics: Plausible snippet present.
- Fake-door pricing intent: logs to local event store and shows "Coming soon".
- Feedback route: /feedback stores issue payload and screenshot.

## Deploy
- Live URL: https://fx-invoice-ledger.vercel.app
- Admin dashboard: https://vercel.com/example/fx-invoice-ledger
- Analytics dashboard: https://plausible.io/fx-invoice-ledger.vercel.app
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
