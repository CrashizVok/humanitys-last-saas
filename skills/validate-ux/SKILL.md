---
name: validate-ux
description: Run Playwright MVP validation for the core flow and report PASS or FAIL with the exact drop-off step.
---

# Validate UX

Use this skill to prove the MVP's core flow works end-to-end. A screenshot or a passing build is
not enough; a user must be able to complete the core job.

## Setup

- Read `.saas/state.md`, `.saas/proof.md`, and `.saas/README.md` to identify the core flow.
- Ensure Playwright is available. If missing, install it in the project scope and record the
  command. If installation is not possible, report the blocker.
- Ensure the app is running locally or at the deployed URL. Record the target URL.

## Core checks

Run Playwright tests or scripted browser checks for:

1. Landing page loads in production mode/container target.
2. Hero/value prop, pricing/packages section, and "Coming soon" package state are visible.
3. User can click a paid/package CTA, intent is logged, and UI shows "Coming soon" with no charge.
4. `/feedback` route accepts feedback and screenshot attachment/capture path works.
5. Analytics snippet is present in the built page.
6. No real dashboard/app route is exposed (no authenticated dashboard, no admin product UI).

Save screenshots to `.saas/verify/` on failure and optionally on pass.

## Output format

Return exactly one line first:

- `PASS`
- `FAIL + exact step where user dropped off`

Then include evidence: command run, URL, observed result, screenshot path, and suggested owner.

## Rules

- Do not claim PASS if any core-flow step was skipped.
- A flaky test is a FAIL until rerun and explained.
- Record commands and output tails in `.saas/log.md`.
- Update `.saas/state.md` with validation status and date.
