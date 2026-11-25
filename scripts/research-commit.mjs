#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(process.argv[2] || process.cwd())
const slugArg = process.argv[3]
const verdictArg = process.argv[4]
const dateArg = process.argv[5]

const read = (p) => {
  try { return readFileSync(p, "utf8") } catch { return "" }
}

const state = read(resolve(root, ".saas/state.md"))
const pick = (re, fallback = "") => (state.match(re)?.[1] ?? fallback).trim()

const slug = slugArg || pick(/^slug:\s*(.+)$/mi) || pick(/^#\s+(.+)$/m).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "research"
const verdict = verdictArg || pick(/^verdict:\s*(.+)$/mi) || pick(/VERDICT:\s*(gap|no gap|weak gap)/i) || "unknown"
const date = dateArg || new Date().toISOString().slice(0, 10)
const message = `research: ${slug} — ${verdict} — ${date}`

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: root, stdio: "pipe", encoding: "utf8", ...opts })

try {
  run("git", ["rev-parse", "--is-inside-work-tree"])
} catch {
  console.error("not a git repository; skipping commit")
  process.exit(0)
}

if (!existsSync(resolve(root, ".saas"))) {
  console.error(".saas/ not found; nothing to commit")
  process.exit(1)
}

try {
  run("git", ["add", ".saas/"])
  const status = run("git", ["status", "--porcelain", "--", ".saas/"]).trim()
  if (!status) {
    console.log("no .saas changes to commit")
    process.exit(0)
  }
  run("git", ["commit", "-m", message])
  const hash = run("git", ["rev-parse", "--short", "HEAD"]).trim()
  console.log(`committed ${hash}: ${message}`)

  if (process.env.GITHUB_TOKEN) {
    try {
      const remotes = run("git", ["remote"]).split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
      if (remotes.includes("origin")) {
        run("git", ["push", "origin", "HEAD"])
        console.log("pushed to origin")
      } else {
        console.log("GITHUB_TOKEN set but no origin remote; skipped push")
      }
    } catch (error) {
      console.error(`push failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
} catch (error) {
  console.error(`commit failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
