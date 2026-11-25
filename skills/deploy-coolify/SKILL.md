---
name: deploy-coolify
description: Deploy a production Docker MVP to Coolify on the user's VPS, route via Cloudflare Tunnel to <slug>.zerohook.org, verify, and roll back on failure.
---

# Deploy Coolify

Use this skill after the app builds, tests pass, and the Docker image builds locally. Target infrastructure is fixed: Coolify on the user's VPS, Cloudflare Tunnel for `*.zerohook.org`. No Fly.io, no Vercel, no external SaaS.

## Defaults

- Domain base: `zerohook.org`
- Target URL: `https://<slug>.zerohook.org`
- Deploy target: Coolify (Dockerfile build pack)
- Container: single container, no sidecars
- Volume: `/data` (SQLite DB + backups)
- Restart policy: `unless-stopped`
- Health check: `curl -f http://localhost:3000/healthz`

## Preflight

1. Confirm local production build, `npm test`, and Docker build pass. Record commands in `.saas/log.md`.
2. Detect Coolify config:
   - `COOLIFY_API_TOKEN` env, or
   - `~/.config/coolify/config` (contains token/url)
   - `COOLIFY_BASE_URL` env (default from config; if missing mark blocker)
3. If Coolify is unreachable or token missing, do not fake deploy. Generate
   `docker-compose.local.yml`, write `DEPLOY PENDING` in `.saas/state.md`, and record exact blocker.
4. Generate `.env.example` with required var names and safe empty values. Never print secret values.

Required env vars to configure in Coolify (values set via API/UI, never logged):

- `SMTP_HOST` (default `localhost`)
- `SMTP_PORT` (default `25`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `NOTIFY_EMAIL`
- `ADMIN_USER`
- `ADMIN_PASS`

Auto-generate secrets locally (`openssl rand -base64 32`) only when needed; store in Coolify env vars via API, never print secret values.

## Slug and domain

- Generate slug from product name: lowercase, hyphens, alnum only.
- Check collision in Coolify app names/domains; if `<slug>.zerohook.org` exists, append `-2`, `-3`.
- Write final slug and domain to `.saas/state.md`.
- Check Cloudflare Tunnel wildcard `*.zerohook.org`. If present, routing is active. If not, add
  snippet to `.saas/README.md`:

```yaml
- hostname: <slug>.zerohook.org
  service: http://<coolify-internal-ip>:<port>
```

## Deploy via Coolify API

Use `scripts/coolify-deploy.mjs` or equivalent API calls:

- Create/find application: name `<slug>-mvp`, build pack Dockerfile, domain `<slug>.zerohook.org`,
  port auto-detected from Dockerfile `EXPOSE` (default 3000).
- Configure persistent volume: `/data` for SQLite and backups.
- Set env vars in Coolify (never log values).
- Set health check to `curl -f http://localhost:3000/healthz`.
- Set restart policy to `unless-stopped`.
- Trigger deploy, poll status until running/healthy or timeout.
- On success: record `https://<slug>.zerohook.org` in `.saas/state.md` and `.saas/README.md`.

## Verify

- `curl -f https://<slug>.zerohook.org/healthz`
- `curl -f https://<slug>.zerohook.org`
- Verify SSL cert valid (not self-signed).
- Check security headers present.
- Check TTFB < 2s; report if slower.
- Save screenshot to `.saas/verify/production.png`.

## Rollback

On failure:

1. Save failing command, error tail, and Coolify deploy status.
2. Call Coolify restart/rollback to previous image if available.
3. Mark deploy failed in `.saas/state.md`; keep previous live URL active if any.
4. Do not report a new live URL for a failed deploy.

## Output

Record in `.saas/state.md`: `domain_status: active|pending_dns|pending_deploy`,
`deploy_target: coolify`, live URL, Coolify app id/name, DNS/Tunnel status, volume/healthcheck config, rollback info.
