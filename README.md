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
| `saas` | primary | none | Runs the loop, owns `.saas/state.md`, verifies the result |
| `saas-ideator` | subagent | `jarvis-*` | Research first ideation, returns two defensible ideas |
| `saas-prover` | subagent | `proofe-it` | Verdict `gap` or `no gap` with named competitors, quotes, and kill criteria |
| `saas-designer` | subagent | `steal-a-design`, `every-diagram` | Tokens, layout, screenshots, architecture diagram |
| `saas-builder` | subagent | `ttfr`, `keep-going`, `deploy-it`, `validate-ux` | Builds until it runs, deploys, records live URL or blocker |
| `saas-writer` | subagent | `humanize` | Every user-visible string, checker must exit 0 |
| `saas-validator` | subagent | `validate-ux` | Playwright core-flow check, reports `PASS` or `FAIL + exact step` |
| `saas-growth-writer` | subagent | `humanize`, `growth-copy` | Headlines, SEO, onboarding emails, fake-door pricing |

Each agent has a `skill` deny rule and a narrow allow list, so an agent cannot wander into
another phase's method. The lead cannot load skills at all, which keeps it a scheduler.

## Where the skills come from

Six repositories, fetched at plugin load and re-fetched on a timer:

| Repository | Gives |
| --- | --- |
| `CrashizVok/jarvis-thinking` | 15 `jarvis-*` skills |
| `CrashizVok/proofe-it` | `proofe-it` |
| `CrashizVok/steal-a-design` | `steal-a-design` |
| `CrashizVok/every-diagram` | `every-diagram` |
| `CrashizVok/keep-going` | `keep-going` |
| `CrashizVok/ttfr` | `ttfr` |

Checkouts land in `~/.cache/humanitys-last-saas/` as shallow clones. Each repository is fetched
at most once an hour. If a fetch fails, the plugin warns and uses the cached checkout; if no cache
exists, it continues without that repo instead of crashing. `humanize`, `deploy-it`,
`validate-ux`, and `growth-copy` ship inside this package under `skills/`.

Because the plugin registers these ids at runtime, do not also add the same repositories to
`skills` in `opencode.json`. Two sources for one id is a race you cannot see. The same goes for
the `jarvis-thinking` plugin: it registers the same `jarvis-*` ids, so keep one of the two.

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

`refreshMinutes` is the minimum gap between fetches for one repository, default 180.

## What it writes

Inside the project it builds:

```text
.saas/
├── state.md          decisions, gates, kill criteria, metrics, deploy URL, next action
├── log.md            command output the agents relied on
├── ideas.md          survivors, difference sentences, rejections
├── proof.md          competitors, quotes, gap, wedge, kill criteria
├── design/           tokens, layout, shots, architecture
├── growth/           headlines, SEO, onboarding emails, fake-door pricing
├── feedback.md       user feedback and screenshots
├── verify/           Playwright screenshots and validation artifacts
└── README.md         what it is, live URL, analytics, metrics guide, human TODOs
```

## MVP factory guarantees

- **Deploy:** `saas-builder` loads `deploy-it` after a successful build. Default is Vercel; Fly.io
  for backend-heavy apps. Deploy failures roll back to the last working deployment and log why.
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
criteria, growth assets, feedback log, and validation result.

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

MIT for this package. The skills it loads keep their own licenses from their repositories.
