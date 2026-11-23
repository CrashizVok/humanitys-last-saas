---
name: deploy-it
description: Deploy a built MVP as a single production Docker container, verify auth, capture live URL, and roll back on failure.
---

# Deploy It

Use this skill after the app builds, the Docker image builds, and the core flow works locally. The
goal is a live URL with a recorded deploy trail, or a clear blocker with no fake success.

## Choose target

- **Fly.io** default for the single production Docker container MVP.
- **Another container-capable target** only when it runs the same image/container with equivalent
  HTTPS, env var, and rollback support.
- **Vercel** only for non-Dockerized legacy cases explicitly allowed by the lead; not the default
  for the one-container MVP.

Write the choice and one-line reason to `.saas/log.md`.

## Preflight

1. Confirm the production build and Docker image build pass locally. Record commands and tail output
   in `.saas/log.md`.
2. Check CLI auth:
   - Fly.io: `fly auth whoami`
   - Vercel (legacy exception only): `vercel whoami`
3. If auth is missing, do not guess credentials. Record the blocker in `.saas/state.md` and
   `.saas/README.md`, then stop the deploy step.
4. Identify required env vars from `.env.example`, README, or config. Never print secret values.
   Confirm they are set in the deploy target or document the exact missing names.
5. Confirm the container runs with production env, listens on the expected port, and has no dev-only
   commands.

## Deploy

### Docker sanity check

```sh
docker build -t mvp-app .
docker run --rm -p 3000:3000 --env-file .env.example mvp-app
```

Adjust image name, port, and env file to the project. Record the result.

### Fly.io (default)

```sh
fly launch --now --copy-config --yes
# or for existing app
fly deploy
```

Capture the app URL (`https://<app>.fly.dev` unless custom domain). The admin dashboard is
`https://fly.io/apps/<app>`.

### Vercel (legacy exception only)

```sh
vercel --yes
vercel --prod --yes
```

Use only when the lead explicitly allows a non-Docker deploy. Capture the production URL and admin
dashboard URL from CLI output.

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
