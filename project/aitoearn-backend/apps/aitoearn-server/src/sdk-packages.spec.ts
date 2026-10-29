/**
 * @airongrong SDK 三包全能力消费测试。
 *
 * 覆盖 npm 已发布包（node_modules 解析，非 workspace 源码）的每一条对外能力：
 * - @airongrong/plugin-api：清单校验、JSON Schema 导出、版本兼容、入口静态扫描、错误码/枚举
 * - @airongrong/capability：清单加载、五表面生成器（单独 + generateAllSurfaces）、describeAction
 * - @airongrong/plugin-cli：new / verify / pack / sign / keygen / cap 全命令
 *
 * 此文件是依赖升级（@aitoearn → @airongrong）后的契约基线：registry 包行为与本仓库
 * 消费方式（plugin-host / agent / capability.yaml / 官方插件）不一致时立即失败。
 */
import type { PluginError as PluginErrorShape } from '@airongrong/plugin-api'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import {
  ALLOWED_ENTRY_IMPORT,
  AgentError,
  AgentErrorCode,
  assertPluginEntrySource,
  DraftBlockKind,
  DraftVisibility,
  HOST_API_VERSION,
  isApiCompatible,
  PluginError,
  PluginErrorCode,
  PluginHookName,
  PluginType,
  pluginManifestJsonSchema,
  PLUGIN_ID_PATTERN,
  satisfiesVersion,
  ValidationIssueSeverity,
  verifyManifest,
} from '@airongrong/plugin-api'
import {
  describeAction,
  generateAllSurfaces,
  generateMcpTools,
  generateOpenApi,
  generateSdkTypes,
  generateUiForms,
  generateValidationRules,
  loadCapabilityManifest,
  verifyCapabilityManifest,
} from '@airongrong/capability'
import { describe, expect, it } from 'vitest'

const require = createRequire(__dirname)
const backendRoot = join(__dirname, '..', '..', '..')
const pluginsDir = join(backendRoot, 'plugins')
const capabilityYaml = join(backendRoot, 'capability', 'capability.yaml')
const cliMain = join(dirname(require.resolve('@airongrong/plugin-cli/package.json')), 'dist', 'main.js')

function runCli(args: string[], cwd = backendRoot): Promise<{ code: number, stdout: string, stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [cliMain, ...args], { cwd, timeout: 30_000 }, (error, stdout, stderr) => {
      if (error && error.code === 'ETIMEDOUT') {
        reject(error)
        return
      }
      resolve({ code: error?.code ?? 0, stdout, stderr })
    })
  })
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>
}

describe('@airongrong/plugin-api —— 清单 schema 与校验', () => {
  it('接受仓库内两个官方插件的 plugin.json', async () => {
    for (const id of ['hook.media-spec', 'skill.aitoearn']) {
      const raw = await readJson(join(pluginsDir, id, 'plugin.json'))
      const manifest = verifyManifest(raw)
      expect(manifest.id).toBe(id)
      expect(manifest.apiVersion).toBe('^1.0.0')
    }
  })

  it('拒绝非法清单并给出 PluginError（AIT-PL-001）', async () => {
    const base = await readJson(join(pluginsDir, 'hook.media-spec', 'plugin.json'))
    const cases: Array<[string, Record<string, unknown>]> = [
      ['id 含大写', { ...base, id: 'Hook.Media' }],
      ['网络白名单通配符', { ...base, permissions: { network: ['*.example.com'] } }],
      ['网络白名单超 5 个域名', { ...base, permissions: { network: ['a.com', 'b.com', 'c.com', 'd.com', 'e.com', 'f.com'] } }],
      ['IP 域名', { ...base, permissions: { network: ['127.0.0.1'] } }],
      ['skill 携带 entry', { ...base, type: 'skill', entry: { module: './dist/index.mjs', sha256: '0'.repeat(64) } }],
    ]
    for (const [label, input] of cases) {
      try {
        verifyManifest(input)
        expect.unreachable(`${label} 应被拒绝`)
      }
      catch (error) {
        expect(error, label).toBeInstanceOf(PluginError)
        expect((error as PluginErrorShape).code).toBe(PluginErrorCode.InvalidManifest)
      }
    }
  })

  it('PLUGIN_ID_PATTERN 约束 skill/hook/channel 前缀与 [a-z0-9-] 分段', () => {
    for (const ok of ['hook.media-spec', 'channel.acme-2', 'skill.aitoearn']) {
      expect(PLUGIN_ID_PATTERN.test(ok), ok).toBe(true)
    }
    for (const bad of ['Hook.media', 'hook..spec', '-hook', 'hook_media', 'skill.xhs_copywriting']) {
      expect(PLUGIN_ID_PATTERN.test(bad), bad).toBe(false)
    }
  })

  it('pluginManifestJsonSchema 导出可用的 JSON Schema 文档', () => {
    expect(pluginManifestJsonSchema['$schema']).toContain('json-schema.org')
    const properties = pluginManifestJsonSchema['properties'] as Record<string, unknown>
    expect(properties).toHaveProperty('id')
    expect(properties).toHaveProperty('permissions')
    expect(properties).toHaveProperty('entry')
  })
})

describe('@airongrong/plugin-api —— 版本兼容（engines.apiVersion 门禁同源）', () => {
  it('HOST_API_VERSION 是 semver 形态', () => {
    expect(HOST_API_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('satisfiesVersion 支持 caret 与区间', () => {
    expect(satisfiesVersion('1.2.0', '^1.0.0')).toBe(true)
    expect(satisfiesVersion('2.0.0', '^1.0.0')).toBe(false)
    expect(satisfiesVersion('1.0.0', '>=1.0.0 <3')).toBe(true)
    expect(satisfiesVersion('3.0.0', '>=1.0.0 <3')).toBe(false)
  })

  it('isApiCompatible 以 HOST_API_VERSION 为默认宿主版本', () => {
    expect(isApiCompatible('^1.0.0')).toBe(true)
    expect(isApiCompatible(`^${HOST_API_VERSION}`)).toBe(true)
    expect(isApiCompatible('^2.0.0')).toBe(false)
    expect(isApiCompatible('^1.0.0', '0.9.0')).toBe(false)
  })
})

describe('@airongrong/plugin-api —— 入口静态扫描（与宿主加载器同一份 assert）', () => {
  it(`允许静态与字面量动态导入 ${ALLOWED_ENTRY_IMPORT}`, () => {
    expect(() => assertPluginEntrySource(`import { defineHookPlugin } from '${ALLOWED_ENTRY_IMPORT}'`)).not.toThrow()
    expect(() => assertPluginEntrySource(`const m = await import('${ALLOWED_ENTRY_IMPORT}')`)).not.toThrow()
  })

  it('拒绝 node: 内置模块与字面量动态导入', () => {
    for (const source of [
      `import fs from 'node:fs'`,
      `import { exec } from 'node:child_process'`,
      `const m = await import('node:child_process')`,
    ]) {
      expect(() => assertPluginEntrySource(source), source).toThrow(PluginError)
    }
  })

  // 已知缺口（AIT-GAP-1）：ENTRY_IMPORT_PATTERN 只匹配字面量 specifier，计算型动态导入
  // （模板字符串/拼接）可绕过静态扫描。it.fails 在缺口修复前保持失败提醒。
  it.fails('已知缺口：计算型动态导入暂未被入口扫描拦截', () => {
    expect(() => assertPluginEntrySource(`const m = await import(\`node:fs\`)`)).toThrow(PluginError)
  })
})

describe('@airongrong/plugin-api —— 错误码与枚举', () => {
  it('PluginErrorCode 覆盖 AIT-PL-001~008 且 PluginError 携带 code/details', () => {
    expect(PluginErrorCode.InvalidManifest).toBe('AIT-PL-001')
    expect(PluginErrorCode.HookRejected).toBe('AIT-PL-007')
    expect(PluginErrorCode.IdempotencyConflict).toBe('AIT-PL-008')
    const error = new PluginError(PluginErrorCode.HookRejected, '拒绝发布', { pluginId: 'hook.media-spec' })
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe('AIT-PL-007')
    expect(error.details).toEqual({ pluginId: 'hook.media-spec' })
  })

  it('AgentErrorCode 覆盖写护栏五码，AgentError 可实例化', () => {
    expect(Object.keys(AgentErrorCode)).toEqual(['Unauthorized', 'WriteNotConfirmed', 'RateLimited', 'ContentRiskControl', 'RevokeTimeout'])
    const error = new AgentError(AgentErrorCode.WriteNotConfirmed, '缺少 confirmToken')
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe(AgentErrorCode.WriteNotConfirmed)
  })

  it('契约枚举值稳定（宿主/CLI/插件三方共用）', () => {
    expect(PluginType.Hook).toBe('hook')
    expect(PluginType.Adapter).toBe('adapter')
    expect(PluginType.Skill).toBe('skill')
    expect(PluginHookName.ValidateDraft).toBe('validateDraft')
    expect(PluginHookName.BeforePublish).toBe('beforePublish')
    expect(PluginHookName.AfterPublish).toBe('afterPublish')
    expect(PluginHookName.OnAuthExpired).toBe('onAuthExpired')
    expect(DraftBlockKind.Video).toBe('video')
    expect(DraftVisibility.Public).toBe('public')
    expect(ValidationIssueSeverity.Error).toBe('error')
  })
})

describe('@airongrong/capability —— 清单加载与校验', () => {
  it('加载仓库 capability.yaml 并通过 verifyCapabilityManifest 回环', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    expect(Object.keys(manifest.actions)).toHaveLength(12)
    expect(verifyCapabilityManifest(manifest)).toEqual(manifest)
  })

  it('verifyCapabilityManifest 拒绝缺字段/非法 sideEffect 的清单', () => {
    expect(() => verifyCapabilityManifest({ actions: {} })).toThrow()
    expect(() => verifyCapabilityManifest({
      version: 1,
      actions: {
        bad: { summary: 'x', sideEffect: 'destroy', confirm: 'none', inputs: {}, returns: {}, errors: [] },
      },
    })).toThrow()
  })

  it('describeAction 生成契约的人类可读描述', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const action = manifest.actions['publish_post']
    const text = describeAction('publish_post', action)
    expect(text).toContain(action.summary)
    expect(text).toContain('写操作')
    expect(text).toContain(action.errors[0])
  })
})

describe('@airongrong/capability —— 五表面生成器', () => {
  it('MCP 工具表面：12 个契约，写工具带 confirm 标记', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const tools = generateMcpTools(manifest)
    expect(tools).toHaveLength(12)
    const publish = tools.find(tool => tool.name === 'publish_post')
    expect(publish).toBeDefined()
    expect(publish?.confirm).toBe('required')
    expect(publish?.inputSchema['type']).toBe('object')
  })

  it('GUI 表单表面：每个动作一份表单，字段带 ui 控件标注', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const forms = generateUiForms(manifest)
    expect(forms).toHaveLength(12)
    const draft = forms.find(form => form.action === 'create_draft')
    expect(draft?.fields.map(field => field.name)).toContain('title')
  })

  it('OpenAPI 表面：3.1 文档，按动作派生路径', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const doc = generateOpenApi(manifest)
    expect(doc.openapi).toBe('3.1.0')
    expect(Object.keys(doc.paths)).toContain('/actions/publish_post')
  })

  it('SDK 类型表面：生成可编译的 TS 联合类型与接口', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const source = generateSdkTypes(manifest)
    expect(source).toContain('export type CapabilityActionName')
    expect(source).toContain("'publish_post'")
  })

  it('校验规则表面：派生 maxLength/maxItems 约束', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const rules = generateValidationRules(manifest)
    expect(rules).toHaveLength(12)
    const draft = rules.find(rule => rule.action === 'create_draft')
    expect(draft?.maxLength['title']).toBe(100)
  })

  it('generateAllSurfaces 一次产出五个表面且与单独生成一致', async () => {
    const manifest = await loadCapabilityManifest(capabilityYaml)
    const all = generateAllSurfaces(manifest)
    expect(Object.keys(all).sort()).toEqual(['mcp', 'openapi', 'sdk', 'ui', 'validation'])
    expect(all.mcp).toEqual(generateMcpTools(manifest))
    expect(all.ui).toEqual(generateUiForms(manifest))
    expect(all.openapi).toEqual(generateOpenApi(manifest))
    expect(all.sdk).toBe(generateSdkTypes(manifest))
    expect(all.validation).toEqual(generateValidationRules(manifest))
  })
})

describe('@airongrong/plugin-cli —— 六个命令全链路', () => {
  it('keygen 生成 ed25519 开发密钥对', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-cli-keygen-'))
    const result = await runCli(['keygen', '--out', dir])
    expect(result.code).toBe(0)
    const files = await readdir(dir)
    expect(files).toContain('dev.pem')
    expect(files).toContain('dev.pub')
  })

  it('new 脚手架 → 回填 sha256 → verify 通过 → pack 产出 .aitpkg', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-cli-flow-'))
    const created = await runCli(['new', 'hook.probe-e2e', '--type', 'hook', '--dir', dir])
    expect(created.code).toBe(0)

    const pluginDir = join(dir, 'hook.probe-e2e')
    const manifestPath = join(pluginDir, 'plugin.json')
    const manifest = await readJson(manifestPath) as { entry: { module: string, sha256: string } }
    const entryPath = join(pluginDir, manifest.entry.module)
    manifest.entry.sha256 = createHash('sha256').update(await readFile(entryPath)).digest('hex')
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

    const verified = await runCli(['verify', pluginDir])
    expect(verified.code, verified.stderr).toBe(0)

    const packed = await runCli(['pack', pluginDir])
    expect(packed.code, packed.stderr).toBe(0)
    expect(await readdir(dir)).toContain('hook.probe-e2e-0.1.0.aitpkg')
  })

  it('sign 为插件写入 ed25519 签名，verify 仍然通过', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-cli-sign-'))
    await runCli(['keygen', '--out', dir])
    await runCli(['new', 'hook.probe-sign', '--type', 'hook', '--dir', dir])
    const pluginDir = join(dir, 'hook.probe-sign')
    const manifestPath = join(pluginDir, 'plugin.json')
    const manifest = await readJson(manifestPath) as { entry: { module: string, sha256: string } }
    manifest.entry.sha256 = createHash('sha256').update(await readFile(join(pluginDir, manifest.entry.module))).digest('hex')
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

    const signed = await runCli(['sign', pluginDir, '--key', join(dir, 'dev.pem')])
    expect(signed.code, signed.stderr).toBe(0)
    // 签名产物：entry 模块旁的 <module>.sig（base64 ed25519）
    const sigPath = join(pluginDir, `${manifest.entry.module}.sig`)
    const sig = await readFile(sigPath, 'utf8')
    expect(Buffer.from(sig, 'base64').length).toBe(64)

    const verified = await runCli(['verify', pluginDir])
    expect(verified.code, verified.stderr).toBe(0)
  })

  // 已知缺口（AIT-GAP-2）：verify 只校验 entry.sha256，不消费 .sig；
  // 签名文件当前无任何消费方，篡改 entry 后 verify 依然通过。it.fails 作修复提醒。
  it.fails('已知缺口：verify 不校验 ed25519 签名，篡改 entry 后仍通过', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-cli-gap-'))
    await runCli(['keygen', '--out', dir])
    await runCli(['new', 'hook.probe-gap', '--type', 'hook', '--dir', dir])
    const pluginDir = join(dir, 'hook.probe-gap')
    const modulePath = join(pluginDir, 'dist', 'index.mjs')
    const manifestPath = join(pluginDir, 'plugin.json')
    const manifest = await readJson(manifestPath) as { entry: { module: string } }
    await writeFile(modulePath, `${await readFile(modulePath, 'utf8')}\nconsole.log('tampered')\n`)
    manifest.entry['sha256'] = createHash('sha256').update(await readFile(modulePath)).digest('hex')
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    await runCli(['sign', pluginDir, '--key', join(dir, 'dev.pem')])
    const verified = await runCli(['verify', pluginDir])
    expect(verified.code).not.toBe(0)
  })

  it('verify 拒绝仓库外非法插件', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-cli-bad-'))
    await writeFile(join(dir, 'plugin.json'), JSON.stringify({ id: 'BAD', version: '1.0.0' }))
    const result = await runCli(['verify', dir])
    expect(result.code).not.toBe(0)
  })

  it('cap 从 capability.yaml 产出五个产物文件', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sdk-cli-cap-'))
    const result = await runCli(['cap', '--from', capabilityYaml, '--out', dir])
    expect(result.code, result.stderr).toBe(0)
    const files = (await readdir(dir)).sort()
    expect(files).toEqual(['capability-client.ts', 'mcp-tools.json', 'openapi.json', 'ui-forms.json', 'validation-rules.json'])
    const mcpTools = JSON.parse(await readFile(join(dir, 'mcp-tools.json'), 'utf8')) as Array<{ name: string }>
    expect(mcpTools).toHaveLength(12)
  })

  it('verify 官方插件 hook.media-spec 通过（仓库分发产物与 registry CLI 兼容）', async () => {
    const result = await runCli(['verify', join(pluginsDir, 'hook.media-spec')])
    expect(result.code, result.stderr).toBe(0)
  })
})
