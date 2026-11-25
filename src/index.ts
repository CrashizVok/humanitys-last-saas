import { readFile, stat } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { Plugin, Skill } from "@opencode/plugin"
import { findSkillFiles, skillId, splitFrontmatter } from "./skills.ts"

type SkillRecord = { id: string; name: string; description: string; content: string; path: string }

const bundled = fileURLToPath(new URL("../skills", import.meta.url))
const cacheRoot = join(homedir(), ".cache", "humanitys-last-saas")
const discoveredRoots = [
  cacheRoot,
  join(homedir(), ".agents", "skills"),
  join(homedir(), ".config", "opencode", "skills"),
]

const age = async (path: string) => {
  const info = await stat(path).catch(() => undefined)
  return info ? Date.now() - info.mtimeMs : Number.POSITIVE_INFINITY
}

const readSkills = async (root: string, name: string): Promise<SkillRecord[]> => {
  const records: SkillRecord[] = []
  const files = await findSkillFiles(root).catch(() => [])
  for (const file of files) {
    const { meta, content } = splitFrontmatter(await readFile(file, "utf8"))
    if (!meta.description) continue
    const id = skillId(file, root, name)
    records.push({ id, name: meta.name ?? id, description: meta.description, content, path: file })
  }
  return records
}

export default Plugin.define({
  id: "humanitys-last-saas",
  async setup(ctx) {
    const state: { skills: SkillRecord[] } = { skills: [] }
    const warn = (message: string) => console.warn(`[humanitys-last-saas] ${message}`)

    await ctx.skill.transform((editor) => {
      for (const skill of state.skills) {
        const id = Skill.ID.make(skill.id)
        const fields = {
          name: Skill.Name.make(skill.name),
          description: skill.description,
          content: skill.content,
          path: Skill.Info.fields.path.make(skill.path),
        }
        if (editor.get(id)) editor.update(id, (draft) => Object.assign(draft, fields))
        else editor.add({ id, ...fields })
      }
    })

    const sync = async () => {
      const roots = [
        { dir: bundled, name: "humanitys-last-saas" },
        ...discoveredRoots.map((dir) => ({ dir, name: dir.split("/").filter(Boolean).slice(-2).join("/") || "cache" })),
      ]

      const loaded = await Promise.all(
        roots.map(async ({ dir, name }) => {
          const exists = (await age(dir)) !== Number.POSITIVE_INFINITY
          if (!exists) return [] as SkillRecord[]
          const skills = await readSkills(dir, name)
          return skills
        }),
      )

      const skills = loaded.flat()
      const unique = new Map<string, SkillRecord>()
      for (const skill of skills) {
        if (!unique.has(skill.id)) unique.set(skill.id, skill)
      }
      state.skills = [...unique.values()]
      await ctx.skill.reload()
    }

    await sync().catch((error) => warn(`initial skill scan failed: ${error instanceof Error ? error.message : String(error)}`))

    const saasAgents = new Set(["saas", "saas-builder", "saas-prover", "saas-designer", "saas-ideator", "saas-researcher", "saas-writer", "saas-validator", "saas-growth-writer", "saas-legal-writer", "saas-infrastructure"])

    await ctx.session.hook("context", async (input) => {
      if (!saasAgents.has(String(input.agent))) return
      input.system.push({
        type: "text",
        text: [
          "MVP factory hooks:",
          "- Load `find-skills` before starting a phase when the right skill is not already known. Log the chosen skill or fallback in .saas/log.md.",
          "- If find-skills fails or returns no quality result, fall back to cached/bundled skills and continue. Never stall on skill discovery.",
          "- During market research, check current trend sources (Product Hunt, Hacker News, Indie Hackers, Google Trends) and prefer quickly launchable SaaS ideas with narrow MVP scope.",
          "- Build a production-ready landing page in one Docker container. No real dashboard or authenticated app area. Include pricing/packages marked Coming soon with fake-door intent capture.",
          "- Write secure-by-default code: validate input, no secrets in client, safe headers, minimal dependencies, no dangerous user-input execution.",
          "- Deploy to Coolify on the user's VPS and route via Cloudflare Tunnel to <slug>.zerohook.org. If Coolify/DNS is blocked, fall back to docker-compose.local.yml and mark DEPLOY PENDING / DNS PENDING with exact instructions.",
          "- Generate legal pages (/privacy /terms /cookies /impressum), SEO assets (robots, sitemap, favicon, og-image 1200x630, manifest, canonical/OG/JSON-LD), and launch materials in .saas/launch/.",
          "- Every built app must include lightweight analytics (Plausible/Umami), fake_door_click/feedback_submitted/signup_intent events, UTM support, and /feedback with screenshot capture.",
          "- If deployment fails, roll back to the last working deployed version, log the reason in .saas/log.md, and do not claim a live URL.",
          "- Never ask for clarification or approval; make defensible assumptions and document them. Only stop for missing API tokens, Coolify unreachable, or explicit user interrupt.",
          "- Run saas-validator Playwright checks before handoff. A core landing-page flow that cannot complete is FAIL.",
          "- Record kill criteria and measured metrics in .saas/state.md; check them before continuing work.",
          "- In research-only mode (`mode: research-only` in .saas/state.md or /saas-research command): stop after proof, write .saas/brain-think.md from templates/brain-think.md, commit the research, and do not build/deploy/validate.",
        ].join("\n"),
      } as any)
    })

    await ctx.session.hook("prompt", async (input) => {
      const text = input.prompt?.text ?? ""
      if (!/\b(deploy|validate|kill criteria|analytics|feedback|skill|find-skills|trend|product hunt|launch|research-only|brain-think|saas-research)\b/i.test(text)) return
      input.metadata = {
        ...(input.metadata ?? {}),
        mvpFactory: {
          deploy: /\bdeploy\b/i.test(text),
          validate: /\bvalidate\b/i.test(text),
          metrics: /\b(kill criteria|analytics|feedback)\b/i.test(text),
          skillDiscovery: /\b(skill|find-skills)\b/i.test(text),
          trendResearch: /\b(trend|product hunt|launch)\b/i.test(text),
          researchOnly: /\b(research-only|brain-think|saas-research)\b/i.test(text),
        },
      }
    })

    await ctx.command.transform((editor) => {
      editor.add({
        name: "saas",
        description: "Build a whole SaaS from one sentence: idea, proof, design, build, copy, verify",
        execute: async ({ sessionID, prompt, delivery }) => {
          await ctx.session.switchAgent({ sessionID, agent: "saas" }).catch(() => {})
          await ctx.session.prompt({
            sessionID,
            delivery,
            text: [
              "Start the humanitys-last-saas pipeline.",
              "Use find-skills to discover phase skills dynamically; fall back to cached/bundled skills if discovery fails.",
              "",
              `Brief: ${prompt.text.trim() || "no brief given, pick the opportunity you can prove strongest"}`,
            ].join("\n"),
          })
        },
      })

      editor.add({
        name: "saas-research",
        description: "Research-only: ideation, demand research, proof, brain-think.md. No build, no deploy",
        execute: async ({ sessionID, prompt, delivery }) => {
          await ctx.session.switchAgent({ sessionID, agent: "saas" }).catch(() => {})
          await ctx.session.prompt({
            sessionID,
            delivery,
            text: [
              "Start the humanitys-last-saas pipeline in RESEARCH-ONLY mode.",
              "Set mode: research-only in .saas/state.md before phase 1. Do NOT build, deploy, or write application code.",
              "Pipeline: saas-ideator -> saas-researcher -> saas-prover -> STOP. Then write .saas/brain-think.md (or next run file) from templates/brain-think.md and commit the research.",
              "Use find-skills to discover phase skills dynamically; fall back to cached/bundled skills if discovery fails.",
              "",
              `Brief: ${prompt.text.trim() || "no brief given, pick the opportunity you can prove strongest"}`,
            ].join("\n"),
          })
        },
      })

      editor.add({
        name: "saas-validate",
        description: "Run MVP validation: deploy check, analytics, Playwright core flow, kill criteria",
        execute: async ({ sessionID, prompt, delivery }) => {
          await ctx.session.switchAgent({ sessionID, agent: "saas" }).catch(() => {})
          await ctx.session.prompt({
            sessionID,
            delivery,
            text: [
              "Run MVP validation for the current .saas project.",
              "Use saas-validator for end-to-end checks, confirm analytics/fake-door/feedback are present, and compare measured signals against kill criteria in .saas/state.md.",
              "Report PASS or FAIL with the exact failing step and command output.",
              prompt.text.trim() ? `Extra context: ${prompt.text.trim()}` : "",
            ].filter(Boolean).join("\n"),
          })
        },
      })
    })

    const minutes = Number(ctx.options.refreshMinutes ?? 180)
    const timer = setInterval(() => void sync().catch((error) => warn(`skill rescan failed: ${error instanceof Error ? error.message : String(error)}`)), minutes * 60_000)
    return () => clearInterval(timer)
  },
})
