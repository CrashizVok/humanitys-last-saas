import assert from "node:assert/strict"
import { test } from "node:test"
import { skillId, splitFrontmatter } from "../src/skills.ts"

test("frontmatter is split from the body", () => {
  const raw = "---\nname: Review\ndescription: Reviews a diff\n---\n\n# Review\n\nRead the diff.\n"
  const { meta, content } = splitFrontmatter(raw)
  assert.equal(meta.name, "Review")
  assert.equal(meta.description, "Reviews a diff")
  assert.equal(content, "\n# Review\n\nRead the diff.\n")
})

test("a file without frontmatter keeps its whole text", () => {
  const { meta, content } = splitFrontmatter("# Just a skill\n")
  assert.deepEqual(meta, {})
  assert.equal(content, "# Just a skill\n")
})

test("quoted descriptions lose their quotes", () => {
  const { meta } = splitFrontmatter('---\ndescription: "Does a thing"\n---\nbody\n')
  assert.equal(meta.description, "Does a thing")
})

test("block scalar descriptions are folded to one line", () => {
  const raw = "---\nname: humanize\ndescription: |\n  Make text read as if a person wrote it.\n  Works one-shot and persistent.\n---\nbody\n"
  const { meta } = splitFrontmatter(raw)
  assert.equal(meta.description, "Make text read as if a person wrote it. Works one-shot and persistent.")
})

test("a nested skill takes the directory name", () => {
  assert.equal(skillId("/cache/repo/skills/jarvis-diverge/SKILL.md", "/cache/repo", "repo"), "jarvis-diverge")
})

test("a root skill takes the name passed in", () => {
  assert.equal(skillId("/cache/CrashizVok__every-diagram/SKILL.md", "/cache/CrashizVok__every-diagram", "every-diagram"), "every-diagram")
})

test("ids are lowercase kebab case", () => {
  assert.equal(skillId("/a/Steal A Design/SKILL.md", "/a", "x"), "steal-a-design")
})
