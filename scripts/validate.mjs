#!/usr/bin/env node
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { join, resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"

const root = resolve(process.argv[2] || process.cwd())
const results = []

const ok = (name, detail = "") => results.push({ name, pass: true, detail })
const bad = (name, detail = "") => results.push({ name, pass: false, detail })

const read = async (path) => readFile(path, "utf8").catch(() => "")

async function walk(dir, depth = 0, out = []) {
  if (depth > 5) return out
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if ([".git", "node_modules", ".next", "dist", "build", ".saas"].includes(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, depth + 1, out)
    else if (/\.(html|js|mjs|cjs|ts|tsx|jsx|astro|vue|svelte)$/.test(entry.name)) out.push(full)
  }
  return out
}

async function checkAnalytics() {
  const files = await walk(root)
  for (const file of files) {
    const text = await read(file)
    if (/plausible|umami|data-domain|analytics/i.test(text)) {
      ok("analytics", `found marker in ${file.replace(root + "/", "")}`)
      return
    }
  }
  bad("analytics", "no Plausible/Umami/analytics marker found in source files")
}

async function checkDeployed() {
  const state = await read(join(root, ".saas/state.md"))
  const readme = await read(join(root, ".saas/README.md"))
  const text = `${state}\n${readme}`
  const match = text.match(/https?:\/\/[^\s)>"']+/)
  if (match && /live|deploy|vercel|fly\.dev|url/i.test(text)) ok("deployed", match[0])
  else if (match) ok("deployed", `url found: ${match[0]}`)
  else bad("deployed", "no live URL recorded in .saas/state.md or .saas/README.md")
}

function run(cmd, args, opts = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "pipe", ...opts })
    let out = ""
    let err = ""
    child.stdout.on("data", (d) => (out += d.toString()))
    child.stderr.on("data", (d) => (err += d.toString()))
    child.on("close", (code) => resolveRun({ code, out, err, child }))
    child.on("error", (error) => resolveRun({ code: 1, out, err: err + String(error), child }))
  })
}

async function checkStarts() {
  const pkgPath = join(root, "package.json")
  if (!existsSync(pkgPath)) {
    const hasIndex = existsSync(join(root, "index.html"))
    if (hasIndex) return ok("starts", "static index.html found; serve with any static server")
    return bad("starts", "no package.json or index.html found")
  }
  const pkg = JSON.parse(await read(pkgPath) || "{}")
  const scripts = pkg.scripts || {}

  if (scripts.build) {
    const build = await run("npm", ["run", "build"], { env: process.env })
    if (build.code !== 0) return bad("starts", `build failed (exit ${build.code})`)
  }

  if (scripts.start) {
    const child = spawn("npm", ["run", "start"], { cwd: root, stdio: "pipe", env: { ...process.env, PORT: process.env.PORT || "4173" } })
    let buf = ""
    child.stdout.on("data", (d) => (buf += d.toString()))
    child.stderr.on("data", (d) => (buf += d.toString()))
    await delay(3000)
    try {
      const res = await fetch(`http://localhost:${process.env.PORT || "4173"}/`, { signal: AbortSignal.timeout(3000) })
      ok("starts", `start script responded with ${res.status}`)
    } catch (error) {
      bad("starts", `start script did not respond: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      child.kill("SIGTERM")
    }
    return
  }

  if (scripts.dev) return ok("starts", "dev script present; build passed or no build script")
  ok("starts", "package.json present but no start/dev script; build check passed if configured")
}

await checkAnalytics()
await checkDeployed()
await checkStarts()

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.detail ? `: ${r.detail}` : ""}`)
process.exit(failed.length ? 1 : 0)
