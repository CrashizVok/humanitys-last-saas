---
name: growth-copy
description: Write MVP growth assets: headlines, SEO meta, onboarding emails, and fake-door pricing copy.
---

# Growth Copy

Use this skill to produce launch-ready MVP growth copy grounded in the proof and the built product.

## Inputs

Read `.saas/proof.md`, `.saas/state.md`, `.saas/design/layout.md`, and the app's user-facing copy.
Use only facts you can point to. Mark unknowns as `[[? ...]]`.

## Outputs

Create `.saas/growth/` with:

### `headlines.md`
Three headline variants. For each: headline, subhead, and when to use it.

### `seo.md`
Title tag (<=60 chars target), meta description (<=155 chars target), H1 suggestion, primary
keyword, secondary keywords, and OG title/description.

### `emails.md`
Three-email onboarding sequence:
1. Welcome / first value
2. Core action nudge
3. Feedback / fake-door pricing interest

Each email includes subject, preview text, body, plain-text CTA, and send timing.

### `pricing-fake-door.md`
Fake-door pricing page copy. Include plan cards, CTA, and an honest intent capture message:
clicking pay records interest and shows "Coming soon" without charging. No fake discounts or
invented customer proof.

## Quality bar

- Load `humanize` and run its checker on every file.
- Keep copy specific, plain, and short.
- One voice across all assets.
- No invented numbers, testimonials, logos, or customer names.
