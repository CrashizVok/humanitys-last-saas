#!/usr/bin/env node
import { writeFile } from "node:fs/promises"

const [name = "MVP", out = "public/og-image.png", primary = "#111827", bg = "#f9fafb"] = process.argv.slice(2)

async function trySharp() {
  try {
    const sharp = (await import("sharp")).default
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${bg}"/>
  <rect x="64" y="64" width="1072" height="502" rx="24" fill="${primary}" opacity="0.08"/>
  <text x="96" y="280" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="${primary}">${escapeXml(name)}</text>
  <text x="96" y="360" font-family="Arial, sans-serif" font-size="32" fill="${primary}" opacity="0.75">Launching soon on zerohook.org</text>
</svg>`
    await sharp(Buffer.from(svg)).png().resize(1200, 630).toFile(out)
    console.log(`OK ${out} 1200x630`)
    return true
  } catch {
    return false
  }
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]))
}

if (!(await trySharp())) {
  const svgOut = out.replace(/\.png$/i, ".svg")
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="${bg}"/><text x="96" y="280" font-family="Arial, sans-serif" font-size="72" fill="${primary}">${escapeXml(name)}</text></svg>`
  await writeFile(svgOut, svg)
  console.error(`sharp not available; wrote ${svgOut}. Install sharp or convert to 1200x630 PNG.`)
  process.exit(1)
}
