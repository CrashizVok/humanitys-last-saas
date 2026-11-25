---
name: validate-ux
description: Run tests and Playwright MVP validation for the core flow and report PASS or FAIL with the exact drop-off step.
---

# Validate UX

Use this skill to prove the MVP's core flow works end-to-end and the hard constraints are met. A screenshot or a passing build is not enough.

## Setup

- Read `.saas/state.md`, `.saas/proof.md`, and `.saas/README.md` to identify the core flow.
- Ensure dependencies are installed. If Playwright is missing, install it in project scope and record the command. If installation is not possible, report the blocker.
- Ensure the app is running locally or at the deployed URL. Record the target URL.

## Automated tests

Run `npm test`. All tests must pass. Record command and output tail in `.saas/log.md`. If coverage is reported, confirm 80% minimum.

## Constraint checks

- No i18n packages in `package.json` and no locale routes.
- No external email/SaaS providers in code/deps (`resend`, `postmark`, `sendgrid`, `mailgun`, Sentry, external analytics required for operation).
- SQLite default path `/data/app.db` (or configured equivalent) is used; migrations are idempotent.
- `scripts/backup.sh` exists and is executable.
- Dockerfile and local compose exist; single-container design.

## Core runtime checks

Run Playwright tests or scripted browser checks for:

1. Landing page loads in production mode/container target.
2. Hero/value prop, pricing/packages section, and "Coming soon" package state are visible.
3. User can click a paid/package CTA, intent is recorded, and UI shows "Coming soon" with no charge.
4. `/feedback` accepts feedback and screenshot capture/upload path works.
5. `GET /healthz` returns 200 with `status`, `db`, `uptime`, `memory`, `disk`; DB failure path returns 503 (covered by tests or controlled check).
6. `/admin` requires HTTP Basic Auth.
7. No real dashboard/app/authenticated product area is exposed.
8. Legal pages return 200: `/privacy`, `/terms`, `/cookies`, `/impressum`.
9. SEO assets exist: `/robots.txt`, `/sitemap.xml`, `/favicon.svg`, `/og-image.png` (1200x630), `/manifest.json`.
10. Canonical URL points to `https://<slug>.zerohook.org`. OG/Twitter meta present.
11. Rate limiting returns 429 with `X-RateLimit-Remaining` and `X-RateLimit-Reset` on burst.

Save screenshots to `.saas/verify/` on failure and optionally on pass.

## Output format

Return exactly one line first:

- `PASS`
- `FAIL + exact step where user dropped off`

Then include evidence: command run, URL, observed result, screenshot path, and suggested owner.

## Rules

- Do not claim PASS if any core-flow step or required test run was skipped.
- A flaky test is a FAIL until rerun and explained.
- Record commands and output tails in `.saas/log.md`.
- Update `.saas/state.md` with validation status and date.
