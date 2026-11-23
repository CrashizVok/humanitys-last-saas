# FX Invoice Ledger - MVP handoff

## What it is
A small bookkeeping tool for freelance translators who invoice in one currency and get paid in
another. It shows fee-adjusted earnings per invoice.

## Live URL
- App: https://fx-invoice-ledger.vercel.app
- Admin dashboard: https://vercel.com/example/fx-invoice-ledger
- Analytics dashboard: https://plausible.io/fx-invoice-ledger.vercel.app

## How to run

```sh
npm install
npm run dev
```

Build and smoke check:

```sh
npm run build
npm run validate
```

## Core flow
1. Create an invoice in source currency.
2. Record payout amount and fee in settlement currency.
3. See net earnings and margin.

## Kill criteria
KILL IF: <5% signup rate after 100 visitors OR >80% churn after 7 days

## How to interpret your MVP metrics

Use the kill criteria as a decision rule, not a vanity dashboard.

- **Signup rate (acquisition):** signups or signup clicks divided by unique visitors. Below 5%
  after 100 visitors means the value proposition or audience is weak. Before killing, check
  traffic quality and headline clarity.
- **Core-flow completion (activation):** users who finish the main job divided by users who start
  it. A low rate points to UX friction; look at the validator FAIL step and `/feedback`.
- **Fake-door pay intent:** clicks on pricing/pay CTA that show "Coming soon". This measures
  willingness to pay before you build billing. Treat it as a signal, not revenue.
- **Churn / return (retention):** users who do not return within 7 days. Above 80% churn after 7
  days means the product did not earn a second use. Check feedback before changing features.
- **Decision:** if a kill threshold is crossed, stop building new features. Record the evidence in
  `.saas/state.md`, write what you learned, and move to the next idea.

## What is stubbed
- Exchange rates are manual entry.
- Fake-door pricing records intent only; no Stripe/billing.
- Feedback creates a local log entry; GitHub issue/email integration needs credentials.

## Deploy
Deployed with `deploy-it` to Vercel. Rollback command: `vercel rollback <deployment-url>`.

## Human still has to do
- Add production analytics domain and verify events.
- Connect feedback route to GitHub Issues or support email.
- Decide real pricing and replace fake-door flow.
