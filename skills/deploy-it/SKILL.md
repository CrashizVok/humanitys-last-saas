---
name: deploy-it
description: Deploy a built MVP to Vercel or Fly.io, verify auth, capture live URL, and roll back on failure.
---

# Deploy It

Use this skill after the app builds and the core flow works locally. The goal is a live URL with a
recorded deploy trail, or a clear blocker with no fake success.

## Choose target

- **Vercel** default for static sites, Next.js, and simple serverless apps.
- **Fly.io** when the app needs a long-running backend, worker, persistent process, or custom
  container runtime.

Write the choice and one-line reason to `.saas/log.md`.

## Preflight

1. Confirm the app builds locally. Record the command and tail output in `.saas/log.md`.
2. Check CLI auth:
   - Vercel: `vercel whoami`
   - Fly.io: `fly auth whoami`
3. If auth is missing, do not guess credentials. Record the blocker in `.saas/state.md` and
   `.saas/README.md`, then stop the deploy step.
4. Identify required env vars from `.env.example`, README, or config. Never print secret values.
   Confirm they are set in the deploy target or document the exact missing names.

## Deploy

### Vercel

```sh
# first deploy in project
vercel --yes
# production deploy
vercel --prod --yes
```

Capture the production URL from command output. The admin dashboard is usually
`https://vercel.com/dashboard` or the project-specific URL shown by the CLI.

### Fly.io

```sh
fly launch --now --copy-config --yes
# or for existing app
fly deploy
```

Capture the app URL (`https://<app>.fly.dev` unless custom domain). The admin dashboard is
`https://fly.io/apps/<app>`.

## Record success

- Write live URL and admin/dashboard link to `.saas/README.md` and `.saas/state.md`.
- Append deploy command and URL output tail to `.saas/log.md`.
- If analytics dashboard URL is known (Plausible/Umami), record it too.

## Rollback on failure

If deployment fails:

1. Save the failing command, exit code, and error tail in `.saas/log.md`.
2. Identify the last working deployment:
   - Vercel: `vercel ls` / `vercel rollback <deployment-url-or-id>`
   - Fly.io: `fly releases` / `fly deploy --image <previous-image>` or `fly releases rollback`
3. Execute rollback when a previous working deployment exists. Record the rollback command and
   result.
4. Update `.saas/state.md` to mark the new deploy as failed and the previous URL as active, or mark
   no live URL if none exists.
5. Do not report a live URL for a failed deploy.

## Safety

- Never expose secrets in logs, commits, or README.
- Prefer project-local config files created by the CLI; review them before commit.
- A deploy without a recorded command trail did not happen.
