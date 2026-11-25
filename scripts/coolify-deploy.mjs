#!/usr/bin/env node
import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const args = process.argv.slice(2)
const getArg = (name, def = "") => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] ?? def : def
}

async function loadConfig() {
  let token = process.env.COOLIFY_API_TOKEN || ""
  let baseUrl = process.env.COOLIFY_BASE_URL || ""
  const cfgPath = join(homedir(), ".config/coolify/config")
  if ((!token || !baseUrl) && existsSync(cfgPath)) {
    const text = await readFile(cfgPath, "utf8").catch(() => "")
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*"?([^"]+)"?\s*$/)
      if (!m) continue
      if (m[1] === "COOLIFY_API_TOKEN" && !token) token = m[2]
      if (m[1] === "COOLIFY_BASE_URL" && !baseUrl) baseUrl = m[2]
    }
  }
  baseUrl = baseUrl.replace(/\/$/, "")
  return { token, baseUrl }
}

async function api(baseUrl, token, path, opts = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  if (!res.ok) throw new Error(`Coolify ${res.status} ${path}: ${text.slice(0, 500)}`)
  return json
}

async function main() {
  const action = getArg("action", "status")
  const { token, baseUrl } = await loadConfig()
  if (!token || !baseUrl) {
    console.error("MISSING_CONFIG: set COOLIFY_API_TOKEN and COOLIFY_BASE_URL or ~/.config/coolify/config")
    process.exit(2)
  }

  if (action === "check") {
    const v = await api(baseUrl, token, "/api/v1/version").catch(() => null)
    console.log(JSON.stringify({ ok: !!v, version: v }))
    return
  }

  if (action === "list") {
    const apps = await api(baseUrl, token, "/api/v1/applications")
    console.log(JSON.stringify(apps))
    return
  }

  if (action === "deploy") {
    const uuid = getArg("uuid")
    if (!uuid) throw new Error("--uuid required")
    const out = await api(baseUrl, token, `/api/v1/deploy?uuid=${encodeURIComponent(uuid)}&force=false`, { method: "GET" })
    console.log(JSON.stringify(out))
    return
  }

  if (action === "status") {
    const uuid = getArg("uuid")
    if (!uuid) throw new Error("--uuid required")
    const out = await api(baseUrl, token, `/api/v1/applications/${encodeURIComponent(uuid)}`)
    console.log(JSON.stringify(out))
    return
  }

  throw new Error(`Unknown action: ${action}`)
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1) })
