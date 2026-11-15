import { readdir } from "node:fs/promises"
import { basename, dirname, join } from "node:path"

export type Meta = { name?: string; description?: string }

const unquote = (value: string) => value.trim().replace(/^["']|["']$/g, "")

// Only name and description matter for advertising a skill, so this reads those two fields
// instead of pulling in a YAML parser. Block scalars (`description: |`) are folded to one line.
export function splitFrontmatter(raw: string): { meta: Meta; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { meta: {}, content: raw }

  const lines = match[1].split(/\r?\n/)
  const meta: Meta = {}

  for (let i = 0; i < lines.length; i++) {
    const field = /^(name|description):\s*(.*)$/.exec(lines[i])
    if (!field) continue
    const key = field[1] as "name" | "description"
    const value = unquote(field[2])

    if (value && !/^[|>]/.test(value)) {
      meta[key] = value
      continue
    }

    const block: string[] = []
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() && !/^\s/.test(lines[j])) break
      block.push(lines[j].trim())
    }
    meta[key] = block.join(" ").trim()
  }

  return { meta, content: raw.slice(match[0].length) }
}

// A directory containing SKILL.md is one skill, so the parent directory names it.
// A repo whose SKILL.md sits at the root takes the name passed in, not the checkout path.
export function skillId(file: string, root: string, fallback: string): string {
  const dir = dirname(file)
  return (dir === root ? fallback : basename(dir))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function findSkillFiles(root: string, depth = 3): Promise<string[]> {
  const found: string[] = []

  const walk = async (dir: string, level: number) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue
      const full = join(dir, entry.name)
      if (entry.isDirectory() && level < depth) await walk(full, level + 1)
      if (entry.isFile() && entry.name === "SKILL.md") found.push(full)
    }
  }

  await walk(root, 0)
  return found.sort()
}
