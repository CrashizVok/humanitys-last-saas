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
          try {
            return { dir: await checkout(source), name }
          } catch (error) {
            // A cached checkout still beats no skills when the network is down.
            console.error(`humanitys-last-saas: ${source.repo} unavailable`, error)
            return { dir: join(cacheRoot, source.repo.replace("/", "__")), name }
          }
        }),
      )

      const roots = [...checkouts, { dir: bundled, name: "humanitys-last-saas" }]
      const skills = (await Promise.all(roots.map(({ dir, name }) => readSkills(dir, name)))).flat()
      const unique = new Map(skills.map((skill) => [skill.id, skill]))
      state.skills = [...unique.values()]
      await ctx.skill.reload()
    }

    await sync().catch((error) => console.error("humanitys-last-saas: initial sync failed", error))

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
    })

    const minutes = Number(ctx.options.refreshMinutes ?? 180)
    const timer = setInterval(() => void sync().catch((error) => console.error("humanitys-last-saas: refresh failed", error)), minutes * 60_000)
    return () => clearInterval(timer)
  },
})
