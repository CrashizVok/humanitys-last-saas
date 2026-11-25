---
name: smtp-sender
description: Send transactional email through a self-hosted SMTP server with SQLite queue fallback. No external email SaaS.
---

# SMTP Sender

Use this skill when the MVP needs to send email (feedback notifications, fake-door intent notifications). Email stays on infrastructure you control.

## Hard constraints

- Own SMTP server only. No Resend, Postmark, SendGrid, Mailgun, SES, or any external email SaaS.
- English only. Plain text templates only, no HTML email.
- All email behavior must have tests.

## Environment

Required env vars (document in `.env.example` with empty/safe values):

- `SMTP_HOST` - default `localhost`
- `SMTP_PORT` - default `25`
- `SMTP_USER` - optional, empty for local unauthenticated relay
- `SMTP_PASS` - optional, empty for local unauthenticated relay
- `SMTP_FROM` - default `noreply@<slug>.zerohook.org`
- `NOTIFY_EMAIL` - operator email for notifications (optional)

Never print secret values. Never commit `.env`.

## Implementation

- Use `nodemailer` with SMTP transport.
- Default connection: `localhost:25`. Assume local Postfix/Exim on the VPS.
- On send failure or SMTP unavailable: insert into SQLite `email_queue` table and return success for the user-facing request. Do not block the user flow on email delivery.
- Retry queued emails every 5 minutes. Increment `attempts`; set `sent_at` on success.
- Queue table lives in the app SQLite database (`/data/app.db`).

## Templates (plain text only)

- `feedback-notification`: subject `New feedback: <short id>`, body includes timestamp, feedback text, screenshot path if any.
- `fake-door-intent`: subject `New intent: <type>`, body includes timestamp, type, payload JSON, IP/user-agent only if already captured by the app's minimal policy.

Keep templates as plain strings/functions in code. No template engine dependency.

## Tests

Create `__tests__/lib/smtp.test.js` (or equivalent for the stack):

- Sends a test email through a mock/injected SMTP transport.
- Verifies connection/config is built from env vars.
- Queues email to SQLite when transport fails.
- Retries queued email and marks `sent_at` on success.
- Verifies no external email provider packages/imports are used.

Run as part of `npm test`.
