# humanitys-last-saas

An OpenCode plugin and agent team that builds a SaaS from one sentence. It runs the loop without
a human: idea, proof against real competitors, design stolen from real sites, build, copy, verify,
deploy, and handoff.

## Install

```sh
opencode plugin add github:CrashizVok/humanitys-last-saas
mkdir -p ~/.config/opencode/agents
cp node_modules/humanitys-last-saas/agents/*.md ~/.config/opencode/agents/
```

The second line is the only manual step, and it is not optional: plugins can read and modify
agents, they cannot create new ones. Without the copy, `/saas` still runs and the lead agent is
missing, so nothing gets delegated.

Then in a project:

```sh
/saas a bookkeeping tool for freelance translators who invoice in two currencies
```

`/saas` switches the session to the `saas` agent and sends the brief.

## The team

| Agent | Mode | Skills it may load | Job |
| --- | --- | --- | --- |
| `saas` | primary | `find-skills` | Runs the loop, owns `.saas/state.md`, routes phases |
| `saas-ideator` | subagent | `find-skills`, `jarvis-*` fallback | Trend-aware research first ideation, returns two quickly launchable ideas |
| `saas-prover` | subagent | `find-skills`, `proofe-it` fallback | Verdict `gap` or `no gap` with competitors, quotes, trend signals, launch-speed, and kill criteria |
| `saas-designer` | subagent | `find-skills`, `steal-a-design`, `every-diagram` fallback | Tokens, layout, screenshots, architecture diagram |
| `saas-builder` | subagent | `find-skills`, `ttfr`, `keep-going`, `deploy-it`, `validate-ux` | Builds a secure production landing page in one Docker container, deploys, records live URL or blocker |
| `saas-writer` | subagent | `find-skills`, `humanize` | Every user-visible string, checker must exit 0 |
| `saas-validator` | subagent | `find-skills`, `validate-ux` | Playwright core-flow check, reports `PASS` or `FAIL + exact step` |
| `saas-growth-writer` | subagent | `find-skills`, `humanize`, `growth-copy` | Headlines, SEO, onboarding emails, fake-door pricing |

Each agent has a `skill` deny rule and a narrow allow list. Agents load `find-skills` first, then
use discovered skills or fall back to cached/bundled skills.

## Dynamic skill discovery

The plugin no longer hardcodes external skill repos. At startup it loads bundled skills and scans
cached/discovered skill locations (`~/.cache/humanitys-last-saas/`, `~/.agents/skills/`,
`~/.config/opencode/skills/`). It starts with zero pre-fetched remote skills.

During each phase, agents use `find-skills` to discover the best skill for the task:

- `saas-ideator`: "SaaS market research, trend discovery, and ideation"
- `saas-prover`: "competitor analysis, trend validation, and market proof"
- `saas-designer`: "UI design token extraction and layout"
- `saas-builder`: "best skill for the detected stack (React/Next/Vue/Svelte)"
- `saas-writer`: "human-sounding copywriting"
- `saas-validator`: "Playwright E2E testing"
- `saas-growth-writer`: "SEO and growth copy"

Quality gates before using a discovered skill: it has `SKILL.md`, clear description, reputable
source, and acceptable install signal. If discovery fails or quality is weak, agents fall back to
cached/bundled skills. If a dynamically found skill fails twice in a run, it is blacklisted in
`.saas/state.md`.

Skill choices are logged to `.saas/log.md`, for example:

```text
Phase: design → Found skill: ui-design-system → Loaded from: github.com/example/ui-design-system → Reason: token extraction workflow
```

## Bundled skills

These ship inside the plugin and are always available as fallbacks/bootstrap:

| Skill | Purpose |
| --- | --- |
| `find-skills` | Dynamic skill discovery meta-skill |
| `humanize` | Human-sounding copy and checker |
| `deploy-it` | Dockerized production deploy, auth checks, rollback |
| `validate-ux` | Playwright MVP validation |
| `growth-copy` | Headlines, SEO, onboarding emails, fake-door pricing |

## Commands

| Command | Purpose |
| --- | --- |
| `/saas <brief>` | Run the full MVP factory pipeline |
| `/saas-validate [context]` | Run MVP validation: deploy, analytics, Playwright core flow, kill criteria |

## Configure

Optional. The defaults need no config.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "github:CrashizVok/humanitys-last-saas",
      "options": { "refreshMinutes": 60 }
    }
  ]
}
```

`refreshMinutes` controls how often the plugin rescans local/cached skill directories.

## What it writes

```text
.saas/
├── state.md          decisions, gates, kill criteria, metrics, deploy URL, skill choices, next action
├── log.md            command output and skill discovery decisions
├── ideas.md          survivors, difference sentences, trend signals, launch scope, rejections
├── proof.md          competitors, quotes, trend signals, launch-speed assessment, gap, wedge, kill criteria
├── design/           tokens, layout, shots, architecture
├── growth/           headlines, SEO, onboarding emails, fake-door pricing
├── feedback.md       user feedback and screenshots
├── verify/           Playwright screenshots and validation artifacts
└── README.md         what it is, live URL, analytics, metrics guide, human TODOs
```

## MVP factory guarantees

- **Trend-aware research:** `saas-ideator` and `saas-prover` check current trend sources (Product
  Hunt, Hacker News, Indie Hackers, Google Trends, and similar public signals) and favor quickly
  launchable SaaS ideas with a narrow MVP scope.
- **One-container production MVP:** the built app ships as a production-ready landing page in one
  Docker container. No real dashboard or authenticated app area is created.
- **Pricing/packages coming soon:** the landing page includes packages/pricing, but every paid CTA
  is a fake-door intent capture that shows "Coming soon" and does not charge.
- **Secure by default:** generated code validates input, keeps secrets out of the client, uses safe
  security headers, avoids dangerous user-input execution, and keeps dependencies minimal.
- **Deploy:** `saas-builder` loads `deploy-it` after a successful build and Docker build. Default is
  Fly.io for Dockerized MVPs. Deploy failures roll back to the last working deployment and log why.
- **Analytics:** every built app includes a lightweight Plausible or Umami snippet and a fake-door
  pay intent action that logs interest and shows "Coming soon".
- **Validation:** `saas-validator` runs Playwright end-to-end checks and reports `PASS` or
  `FAIL + exact step where user dropped off`.
- **Kill criteria:** `saas-prover` writes `KILL IF: <5% signup rate after 100 visitors OR >80% churn after 7 days`
  (or idea-specific thresholds in the same format) to `.saas/proof.md` and `.saas/state.md`.
- **Feedback:** every built app exposes `/feedback` with screenshot capture and logs entries to
  `.saas/feedback.md`.

## Validate a generated app

```sh
npm run validate
```

The script checks for analytics markers, a recorded live URL in `.saas/state.md` or
`.saas/README.md`, and whether the app starts/builds. Run it from the generated project root.

## Example output

See `examples/complete-run/.saas/` for a complete example with live URL, analytics dashboard, kill
criteria, growth assets, feedback log, validation result, and skill discovery log entries.

## What it will not do

Deploy with your credentials, sign up for services, take payments, or write legal pages it
cannot verify. Those end up as a short list in `.saas/README.md`.

It also cannot prove a market exists. `saas-prover` can only report what public complaints and
named competitors show, and it is told to answer `no gap` when the evidence is thin. Expect the
pipeline to kill ideas more often than it builds them. That is the point.

## Development

```sh
npm test        # parser and id tests
npm run check   # typecheck
npm run validate # validate a generated app from its project root
```

## License

MIT for this package. Skills it loads keep their own licenses from their sources.
