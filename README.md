# humanitys-last-saas

An OpenCode plugin and agent team that builds a SaaS from one sentence. It runs the whole loop
without a human: idea, proof against real competitors, design stolen from real sites, build,
copy, verify, handoff.

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
| `saas-prover` | subagent | `proofe-it` | Verdict `gap` or `no gap` with named competitors and quotes |
| `saas-designer` | subagent | `steal-a-design`, `every-diagram` | Tokens, layout, screenshots, architecture diagram |
| `saas-builder` | subagent | `ttfr`, `keep-going` | Builds until it runs, pastes the command output it relied on |
| `saas-writer` | subagent | `humanize` | Every user-visible string, checker must exit 0 |

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
at most once an hour, and a failed fetch falls back to the cached checkout, so an offline start
still has skills. `humanize` ships inside this package under `skills/` because it lives inside
another project rather than in a repository of its own.

Because the plugin registers these ids at runtime, do not also add the same repositories to
`skills` in `opencode.json`. Two sources for one id is a race you cannot see. The same goes for
the `jarvis-thinking` plugin: it registers the same `jarvis-*` ids, so keep one of the two.

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

```
.saas/
├── state.md          decisions, gates, next action, so a fresh session can resume
├── log.md            command output the agents relied on
├── ideas.md          survivors, difference sentences, rejections
├── proof.md          competitors, quotes, gap, wedge, kill criteria
├── design/           tokens.css, layout.md, shots/, architecture
└── README.md         what it is, how to run it, what a human still has to do
```

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
```

## License

MIT for this package. The skills it loads keep their own licenses from their repositories.
