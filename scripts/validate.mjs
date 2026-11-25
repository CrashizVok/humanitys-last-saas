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

const findFirst = async (paths) => {
  for (const p of paths) {
    const full = join(root, p)
    if (existsSync(full)) return full
  }
  return null
}

async function checkLegalPages() {
  const pages = ["privacy", "terms", "cookies", "impressum"]
  const missing = []
  for (const page of pages) {
    const found = await findFirst([
      `public/${page}.html`, `app/${page}/page.tsx`, `app/${page}/page.ts`, `app/${page}/page.jsx`, `app/${page}/page.js`,
      `src/app/${page}/page.tsx`, `src/app/${page}/page.ts`, `pages/${page}.tsx`, `pages/${page}.ts`, `pages/${page}.jsx`, `pages/${page}.js`,
      `legal/${page}.html`, `dist/${page}.html`, `build/${page}.html`,
    ])
    if (!found) missing.push(page)
  }
  if (missing.length) bad("legal-pages", `missing: ${missing.join(", ")}`)
  else ok("legal-pages", "privacy/terms/cookies/impressum present")
}

async function checkSeoAssets() {
  const required = ["robots.txt", "sitemap.xml", "favicon.svg", "og-image.png", "manifest.json"]
  const missing = []
  for (const name of required) {
    const found = await findFirst([`public/${name}`, `static/${name}`, `dist/${name}`, `build/${name}`, name])
    if (!found) missing.push(name)
  }
  if (missing.length) bad("seo-assets", `missing: ${missing.join(", ")}`)
  else ok("seo-assets", "robots/sitemap/favicon/og-image/manifest present")

  const og = await findFirst(["public/og-image.png", "static/og-image.png", "dist/og-image.png", "build/og-image.png", "og-image.png"])
  if (og) {
    try {
      const buf = await readFile(og)
      if (buf.length > 24 && buf.toString("hex", 12, 16) === "49484452") {
        const w = buf.readUInt32BE(16)
        const h = buf.readUInt32BE(20)
        if (w === 1200 && h === 630) ok("og-image-size", "1200x630")
        else bad("og-image-size", `expected 1200x630, got ${w}x${h}`)
      } else bad("og-image-size", "og-image.png is not a valid PNG")
    } catch (e) {
      bad("og-image-size", `unable to read og-image: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}

async function checkCanonical() {
  const files = await walk(root)
  let found = false
  let badHost = false
  for (const file of files) {
    const text = await read(file)
    const m = text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || text.match(/canonical(?:Url)?["']?\s*[:=]\s*["']([^"']+)["']/i)
    if (m) {
      found = true
      if (/zerohook\.org/i.test(m[1]) && !/\.fly\.dev/i.test(m[1])) {
        ok("canonical", m[1])
        return
      }
      if (/\.fly\.dev/i.test(m[1])) badHost = true
    }
  }
  if (found && badHost) bad("canonical", "canonical points to fly.dev; should point to <slug>.zerohook.org")
  else if (found) ok("canonical", "canonical found")
  else bad("canonical", "no canonical URL found pointing to zerohook.org")
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

async function checkCoolify() {
  const token = process.env.COOLIFY_API_TOKEN
  const baseUrl = process.env.COOLIFY_BASE_URL
  if (!token || !baseUrl) return bad("coolify", "COOLIFY_API_TOKEN/COOLIFY_BASE_URL missing")
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/applications`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return bad("coolify", `API ${res.status}`)
    const apps = await res.json().catch(() => [])
    ok("coolify", `reachable, ${Array.isArray(apps) ? apps.length : 0} apps`)
  } catch (e) {
    bad("coolify", e instanceof Error ? e.message : String(e))
  }
}

async function checkSsl() {
  const state = await read(join(root, ".saas/state.md"))
  const m = state.match(/https:\/\/([a-z0-9.-]+\.zerohook\.org)/i)
  if (!m) return bad("ssl", "no zerohook.org URL in .saas/state.md")
  try {
    const res = await fetch(`https://${m[1]}`, { signal: AbortSignal.timeout(5000) })
    ok("ssl", `${m[1]} responded ${res.status}`)
  } catch (e) {
    bad("ssl", `${m[1]}: ${e instanceof Error ? e.message : String(e)}`)
  }
}

await checkAnalytics()
await checkDeployed()
await checkLegalPages()
await checkSeoAssets()
await checkCanonical()
await checkCoolify()
await checkSsl()
await checkStarts()

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.detail ? `: ${r.detail}` : ""}`)
process.exit(failed.length ? 1 : 0)
