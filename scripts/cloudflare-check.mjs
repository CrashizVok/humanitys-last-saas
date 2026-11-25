#!/usr/bin/env node
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

const domain = process.argv[2] || "zerohook.org"
const slug = process.argv[3] || ""

async function checkDns() {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(slug ? `${slug}.${domain}` : domain)}&type=CNAME`)
    const json = await res.json()
    return json
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

async function checkTunnelConfig() {
  const candidates = [
    process.env.CLOUDFLARE_TUNNEL_CONFIG,
    join(homedir(), ".cloudflared/config.yml"),
    "/etc/cloudflared/config.yml",
  ].filter(Boolean)
  for (const p of candidates) {
    if (existsSync(p)) {
      const text = await readFile(p, "utf8").catch(() => "")
      const hasWildcard = text.includes(`*.${domain}`)
      const hasSlug = slug ? text.includes(`${slug}.${domain}`) : false
      return { path: p, hasWildcard, hasSlug }
    }
  }
  return { path: null, hasWildcard: false, hasSlug: false }
}

const dns = await checkDns()
const tunnel = await checkTunnelConfig()
console.log(JSON.stringify({ domain, slug, dns, tunnel, wildcardLikely: tunnel.hasWildcard }, null, 2))
