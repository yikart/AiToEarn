import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import test from 'node:test'

const skillsRoot = new URL('..', import.meta.url).pathname
const excludedPackage = 'dsh-plugin-aitoearn'
const textFile = /\.(?:json|md|mjs|js)$/u
const prohibited = [
  /__AITOEARN_KEY__/u,
  /(?:X-Api-Key|x-api-key)\s*[=:]/u,
  /Authorization\s*[=:]\s*["'`]?Bearer\s+(?:__AITOEARN|\$\{|AITOEARN_)/iu,
  /AITOEARN_(?:CN_)?API_KEY/u,
  /\/api\/unified\/mcp/u,
]

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) return filesIn(file)
    return entry.isFile() && textFile.test(entry.name) ? [file] : []
  })
}

test('non-DSH packages do not ship static AiToEarn API-key authentication', () => {
  const violations = []
  for (const packageEntry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!packageEntry.isDirectory() || packageEntry.name === excludedPackage || packageEntry.name === 'tests') continue
    const packageRoot = join(skillsRoot, packageEntry.name)
    for (const file of filesIn(packageRoot)) {
      const content = readFileSync(file, 'utf8')
      for (const pattern of prohibited) {
        if (pattern.test(content)) violations.push(`${relative(skillsRoot, file)}: ${pattern}`)
      }
    }
  }
  assert.deepEqual(violations, [])
})

test('Codex package ships the concrete MCP configuration declared by its manifest', () => {
  const packageRoot = join(skillsRoot, 'codex-plugin-aitoearn')
  const manifest = JSON.parse(readFileSync(join(packageRoot, '.codex-plugin', 'plugin.json'), 'utf8'))
  const mcpPath = join(packageRoot, manifest.mcpServers.replace(/^\.\//u, ''))

  assert.equal(manifest.mcpServers, './.mcp.json')
  assert.equal(existsSync(mcpPath), true)
  assert.equal(existsSync(join(packageRoot, 'mcp.json')), false)
  assert.equal(existsSync(join(packageRoot, '.mcp.json.tpl')), false)

  const config = JSON.parse(readFileSync(mcpPath, 'utf8'))
  assert.deepEqual(config.mcpServers, {
    'aitoearn-cn': {
      type: 'streamable-http',
      url: 'https://aitoearn.cn/api/ai/agent/mcp',
    },
  })
})

test('Codex package documents global MCP registration before OAuth login', () => {
  const packageRoot = join(skillsRoot, 'codex-plugin-aitoearn')
  const readme = readFileSync(join(packageRoot, 'README.md'), 'utf8')
  const installPrompt = readFileSync(join(packageRoot, '安装提示词.md'), 'utf8')

  for (const document of [readme, installPrompt]) {
    assert.match(document, /codex mcp add aitoearn-cn --url https:\/\/aitoearn\.cn\/api\/ai\/agent\/mcp/u)
    assert.match(document, /codex mcp login aitoearn-cn --oauth-client-registration dcr/u)
  }
})

test('every package README prompts the user to authenticate the MCP connection', () => {
  const promptPattern = /(?:主动发起认证|进行身份验证|主动点击连接\/授权|aitoearn login)/u
  const missing = []
  for (const packageEntry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!packageEntry.isDirectory() || packageEntry.name === 'tests') continue
    const readmePath = join(skillsRoot, packageEntry.name, 'README.md')
    if (!existsSync(readmePath)) continue
    if (!promptPattern.test(readFileSync(readmePath, 'utf8'))) {
      missing.push(packageEntry.name)
    }
  }
  assert.deepEqual(missing, [])
})
