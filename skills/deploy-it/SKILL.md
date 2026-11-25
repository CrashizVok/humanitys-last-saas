---
name: deploy-it
description: Deploy a built MVP as a single production Docker container to Coolify and route it to <slug>.zerohook.org.
---

# Deploy It

This skill is kept for compatibility. The primary workflow is `deploy-coolify`.

Use Coolify on the user's VPS with Cloudflare Tunnel for `*.zerohook.org`. Do not buy domains.

## Workflow

1. Build production app and Docker image. Record commands in `.saas/log.md`.
2. Detect Coolify config from `COOLIFY_API_TOKEN`/`COOLIFY_BASE_URL` or `~/.config/coolify/config`.
3. Generate slug from product name; target `https://<slug>.zerohook.org`.
4. Create/update Coolify app (`<slug>-mvp`, Dockerfile build pack, domain, env vars). Never print secrets.
5. Deploy and poll until running. Verify HTTP, SSL, headers, TTFB < 2s; save screenshot to `.saas/verify/production.png`.
6. If wildcard `*.zerohook.org` is active, mark `domain_status: active`. Otherwise record CNAME/Tunnel snippet and mark `domain_status: pending_dns`. Do not use fly.dev fallback.
7. On failure, roll back to previous image, log reason, do not fake a live URL.

See `deploy-coolify` and `scripts/coolify-deploy.mjs` for API details.