# FX Invoice Ledger - MVP handoff

## What it is
A landing page MVP for freelance translators who invoice in one currency and get paid in another.
It explains the value prop, shows packages as coming soon, and captures interest.

## Live URL
- App: https://fx-invoice-ledger.zerohook.org
- Admin dashboard: https://coolify.example.internal/app/fx-invoice-ledger-mvp
- Analytics dashboard: https://plausible.zerohook.org/fx-invoice-ledger
- DNS status: active (*.zerohook.org Cloudflare Tunnel wildcard)

## Legal pages
- /privacy
- /terms
- /cookies
- /impressum

## Launch materials
- .saas/launch/product-hunt.md
- .saas/launch/twitter-thread.md
- .saas/launch/reddit-posts.md
- .saas/launch/email-waitlist.md
- .saas/launch/indie-hackers.md

## How to run

Production Docker container:

```sh
docker build -t fx-invoice-ledger .
docker run --rm -p 3000:3000 --env-file .env.example fx-invoice-ledger
```

Local dev (if needed):

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
1. Open the landing page.
2. Review pricing/packages marked "Coming soon".
3. Click a package CTA; intent is logged and UI shows "Coming soon".
4. Submit feedback through `/feedback`.

## Kill criteria
KILL IF: <5% signup rate after 100 visitors OR >80% churn after 7 days

## How to interpret your MVP metrics

Use the kill criteria as a decision rule, not a vanity dashboard.

- **Signup rate (acquisition):** signups or signup clicks divided by unique visitors. Below 5%
  after 100 visitors means the value proposition or audience is weak. Before killing, check
  traffic quality and headline clarity.
- **Core-flow completion (activation):** users who finish the main landing-page flow divided by
  users who start it. A low rate points to UX friction; look at the validator FAIL step and
  `/feedback`.
- **Fake-door pay intent:** clicks on pricing/package CTA that show "Coming soon". This measures
  willingness to pay before you build billing. Treat it as a signal, not revenue.
- **Churn / return (retention):** users who do not return within 7 days. Above 80% churn after 7
  days means the product did not earn a second use. Check feedback before changing features.
- **Decision:** if a kill threshold is crossed, stop building new features. Record the evidence in
  `.saas/state.md`, write what you learned, and move to the next idea.

## What is stubbed / coming soon
- All packages/pricing are fake-door only; no Stripe/billing.
- No real dashboard or authenticated app area.
- Feedback creates a local log entry; GitHub issue/email integration needs credentials.

## Security notes
- User input is validated server-side.
- No secrets in client code; env vars documented in `.env.example`.
- Basic security headers enabled in production.
- Fake-door and feedback logs avoid storing sensitive personal data.

## Deploy
Deployed as a single production Docker container with `deploy-coolify` to Coolify. Domain routed by
Cloudflare Tunnel wildcard `*.zerohook.org`. Rollback: use Coolify "restart with previous image".

## Next steps
- Share on Product Hunt using `.saas/launch/product-hunt.md`.
- Check metrics in 7 days or run `/saas-validate`.

## Human still has to do
- Add production analytics domain and verify events.
- Connect feedback route to GitHub Issues or support email.
- Review `[[LEGAL REVIEW]]` placeholders in legal pages.
- Decide real pricing and replace fake-door flow when you are ready to build billing.
