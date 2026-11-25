---
name: launch-kit
description: Generate launch-ready marketing materials (Product Hunt, Twitter/X, Reddit, waitlist email, Indie Hackers) for a built MVP.
---

# Launch Kit

Use this skill after the MVP is built, deployed, and legal/SEO basics are in place. The goal is a
copy-paste launch folder in `.saas/launch/`.

## Inputs

Read `.saas/state.md`, `.saas/proof.md`, `.saas/growth/`, and `.saas/README.md` for product name,
slug, live URL, value prop, audience, pricing/coming-soon state, and proof points. Do not invent
metrics, testimonials, or customer names.

## Output files

Create `.saas/launch/` with:

### `product-hunt.md`
- Tagline (60 chars max)
- Description (200 chars max)
- First comment (founder story, problem, solution; honest, no fake traction)
- Gallery image prompts (3-5 screenshots/mockups)
- Suggested topics/categories
- Launch checklist

### `twitter-thread.md`
- Hook tweet (problem)
- 3-tweet problem thread
- Solution reveal with screenshot placeholder
- CTA to `https://<slug>.zerohook.org` (or live URL from state)
- Hashtag suggestions
- UTM link example: `?utm_source=twitter&utm_medium=social&utm_campaign=launch`

### `reddit-posts.md`
- `r/SideProject` post (showcase format, honest "built with AI" angle allowed)
- Niche subreddit post (value-first, not promotional; include `[[? niche subreddit]]` if unknown)
- 3 comment templates for engagement
- Rule reminder: follow subreddit self-promo rules

### `email-waitlist.md`
- Subject: "You're in - <Product Name>"
- Body: what to expect, timeline, feedback request
- Plain text version
- HTML version (simple, inline-safe)

### `indie-hackers.md`
- "I built this in X hours with AI" post draft (`[[? hours]]` if unknown)
- Problem, build, stack, what is coming soon
- Honest metrics section (use real metrics from `.saas/state.md` or mark `[[? metric]]`)
- Ask for feedback

## Rules

- Every file must use the real live URL/subdomain from `.saas/state.md`.
- Mark unknowns as `[[? ...]]`. Do not invent numbers, users, revenue, or testimonials.
- Keep copy human and specific. No hype, no "revolutionary", no fake urgency.
- Packages are coming soon; do not promise live billing or a real dashboard.
- Include UTM suggestions where relevant.

## Output

Return the created file paths and any `[[? ...]]` placeholders left for the human.