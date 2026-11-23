import { execFile } from "node:child_process"
import { mkdir, readFile, stat } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { Plugin, Skill } from "@opencode/plugin"
import { findSkillFiles, skillId, splitFrontmatter } from "./skills.ts"

const run = promisify(execFile)

type Source = { repo: string; ref: string }
type SkillRecord = { id: string; name: string; description: string; content: string; path: string }

// Skill sources stay in their own repositories so the pipeline always runs the newest text.
const sources: Source[] = [
  { repo: "CrashizVok/jarvis-thinking", ref: "master" },
  { repo: "CrashizVok/proofe-it", ref: "master" },
  { repo: "CrashizVok/steal-a-design", ref: "master" },
  { repo: "CrashizVok/every-diagram", ref: "main" },
  { repo: "CrashizVok/keep-going", ref: "main" },
  { repo: "CrashizVok/ttfr", ref: "main" },
]

const bundled = fileURLToPath(new URL("../skills", import.meta.url))
const cacheRoot = join(homedir(), ".cache", "humanitys-last-saas")

// A hung clone would stall plugin setup, and a credential prompt would wait forever.
const git = (args: string[]) =>
  run("git", args, { timeout: 45_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } })

const age = async (path: string) => {
  const info = await stat(path).catch(() => undefined)
  return info ? Date.now() - info.mtimeMs : Number.POSITIVE_INFINITY
}

const checkout = async (source: Source) => {
  const dir = join(cacheRoot, source.repo.replace("/", "__"))
  const ref = source.ref.replace(/[^\w./-]/g, "")
  const fresh = (await age(join(dir, ".git", "FETCH_HEAD"))) < 60 * 60_000

  if (fresh) return dir
  if ((await age(join(dir, ".git", "HEAD"))) === Number.POSITIVE_INFINITY) {
    await mkdir(cacheRoot, { recursive: true })
    await git(["clone", "--depth", "1", "--branch", ref, `https://github.com/${source.repo}.git`, dir])
  } else {
    await git(["-C", dir, "fetch", "--depth", "1", "origin", ref])
    await git(["-C", dir, "reset", "--hard", "FETCH_HEAD"])
  }
  return dir
}

const readSkills = async (root: string, name: string): Promise<SkillRecord[]> => {
  const records: SkillRecord[] = []
  // A repo that failed to clone leaves no directory; the rest of the skills still load.
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

    // One transform reads the current set, so a refresh only swaps the data and reloads.
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
      const checkouts = await Promise.all(
        sources.map(async (source) => {
          const name = source.repo.split("/")[1]
          const dir = join(cacheRoot, source.repo.replace("/", "__"))
          try {
            return { dir: await checkout(source), name, source: source.repo, cached: false }
          } catch (error) {
            // A cached checkout still beats no skills when the network is down.
            const hasCache = (await age(join(dir, ".git", "HEAD"))) !== Number.POSITIVE_INFINITY
            const detail = error instanceof Error ? error.message : String(error)
            warn(
              hasCache
                ? `${source.repo} unavailable (${detail}); using cached checkout at ${dir}`
                : `${source.repo} unavailable (${detail}); no cached checkout found, continuing without it`,
            )
            return { dir, name, source: source.repo, cached: hasCache }
          }
        }),
      )

      const roots = [...checkouts.map(({ dir, name }) => ({ dir, name })), { dir: bundled, name: "humanitys-last-saas" }]
      const loaded = await Promise.all(
        roots.map(async ({ dir, name }) => {
          const skills = await readSkills(dir, name)
          if (skills.length === 0 && dir !== bundled) warn(`no skills loaded from ${dir}`)
          return skills
        }),
      )
      const skills = loaded.flat()
      const unique = new Map(skills.map((skill) => [skill.id, skill]))
      state.skills = [...unique.values()]
      await ctx.skill.reload()
    }

    await sync().catch((error) => console.error("humanitys-last-saas: initial sync failed", error))

    const saasAgents = new Set(["saas", "saas-builder", "saas-prover", "saas-designer", "saas-ideator", "saas-writer", "saas-validator", "saas-growth-writer"])

    // Deploy/validate hooks: keep the pipeline honest when sessions run through saas agents.
    await ctx.session.hook("context", async (input) => {
      if (!saasAgents.has(String(input.agent))) return
      input.system.push({
        type: "text",
        text: [
          "MVP factory hooks:",
          "- After a successful build, deploy with the deploy-it skill (Vercel default, Fly.io for backend-heavy apps). Record the live URL in .saas/README.md and .saas/state.md.",
          "- If deployment fails, roll back to the last working deployed version, log the reason in .saas/log.md, and do not claim a live URL.",
          "- Every built app must include lightweight analytics (Plausible or Umami), a fake-door pay intent log, and a /feedback route with screenshot capture.",
          "- Run saas-validator Playwright checks before handoff. A core flow that cannot complete is FAIL.",
          "- Record kill criteria and measured metrics in .saas/state.md; check them before continuing work.",
        ].join("\n"),
      } as any)
    })

    await ctx.session.hook("prompt", async (input) => {
      const text = input.prompt?.text ?? ""
      if (!/\b(deploy|validate|kill criteria|analytics|feedback)\b/i.test(text)) return
      input.metadata = {
        ...(input.metadata ?? {}),
        mvpFactory: {
          deploy: /\bdeploy\b/i.test(text),
          validate: /\bvalidate\b/i.test(text),
          metrics: /\b(kill criteria|analytics|feedback)\b/i.test(text),
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
    const timer = setInterval(() => void sync().catch((error) => console.error("humanitys-last-saas: refresh failed", error)), minutes * 60_000)
    return () => clearInterval(timer)
  },
})
