// AiToEarn 全域内容运营助手 · DeepSeek Harness 插件
// 契约对照官方最小范例 @deepseek-ai/dsh-skill-badge（ctx.skills.registerProvider）
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'aitoearn-plugin'
const SKILLS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills')

// 解析 SKILL.md 的 YAML frontmatter（覆盖本包用到的形态：单行值、>- / > 折叠块）
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const out = {}
  let cur = null
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/)
    if (kv) {
      cur = kv[1]
      out[cur] = kv[2]
    } else if (cur && /^[ \t]+\S/.test(line)) {
      out[cur] = (out[cur] ? out[cur] + ' ' : '') + line.trim()
    }
  }
  return out
}

function loadCandidates() {
  const list = []
  let dirs = []
  try { dirs = readdirSync(SKILLS_ROOT) } catch { return list }
  for (const dir of dirs) {
    const file = join(SKILLS_ROOT, dir, 'SKILL.md')
    if (!existsSync(file)) continue
    let raw = ''
    try { raw = readFileSync(file, 'utf8') } catch { continue }
    const fm = parseFrontmatter(raw)
    list.push({
      name: fm.name || dir,
      description: fm.description || '',
      invocation: { modelInvocable: true, userInvocable: true },
      provider: PROVIDER_NAME,
      source: 'bundled',
      resourceBase: { kind: 'directory', path: join(SKILLS_ROOT, dir) },
      rank: 600,
      locator: file,
    })
  }
  return list
}

const provider = {
  name: PROVIDER_NAME,
  list: () => Promise.resolve(loadCandidates()),
  async get(candidate) {
    const name = candidate && candidate.name
    const file = join(SKILLS_ROOT, name, 'SKILL.md')
    const raw = readFileSync(file, 'utf8')
    const fm = parseFrontmatter(raw)
    return {
      name,
      description: fm.description || (candidate && candidate.description) || '',
      invocation: { modelInvocable: true, userInvocable: true },
      provider: PROVIDER_NAME,
      source: 'bundled',
      resourceBase: { kind: 'directory', path: join(SKILLS_ROOT, name) },
      content: raw,
    }
  },
}

/** Cordis 插件名（与 cordis.patch.yml 条目一致）。 */
const name = 'dsh-plugin-aitoearn'
/** 技能注册表服务。 */
const inject = ['skills']
/** 把包内 skills/ 目录注册为技能提供方。 */
function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
