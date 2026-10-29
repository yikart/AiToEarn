import type { PluginHostLoader } from './plugin-host.loader'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { PluginErrorCode, verifyManifest } from '@airongrong/plugin-api'
import { afterEach, describe, expect, it } from 'vitest'
import { InMemoryPluginKvStore } from './plugin-host.kv-store'
import { createTestKeyPair, writeTestPluginPackage } from './plugin-host.testing'

const tmpDirs: string[] = []

async function makeLoader(options: {
  trustedKeys?: string[]
  hostVersion?: string
  activateTimeoutMs?: number
} = {}): Promise<PluginHostLoader> {
  const { PluginHostLoader: Loader } = await import('./plugin-host.loader')
  return new Loader(
    {
      dir: '',
      trustedKeys: options.trustedKeys ?? [],
      hostVersion: options.hostVersion ?? '1.0.0',
      activateTimeoutMs: options.activateTimeoutMs,
    },
    {
      resolveSecret: async () => 'secret-value',
      kvStore: new InMemoryPluginKvStore(),
    },
  )
}

async function track(dir: string) {
  tmpDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('pluginHostLoader', () => {
  it('合法 hook 插件激活成功，并可调用钩子', async () => {
    const { dir } = await writeTestPluginPackage({
      id: 'hook.media-spec',
      type: 'hook',
      entrySource: `export async function activate() {
        return { hooks: { async beforePublish(draft) { if (draft.text.includes('违禁')) throw new Error('包含违禁词') } } }
      }`,
    })
    const loader = await makeLoader()
    const manifest = verifyManifest(JSON.parse(await readFile(join(dir, 'plugin.json'), 'utf8')) as never)
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('active')
    // 名副其实：真的调用一次 beforePublish 钩子（内容合规应放行）
    const { PluginHookScheduler } = await import('./plugin-host.hooks')
    const summary = await new PluginHookScheduler(loader).runBeforePublish({
      text: '正常内容',
      images: [],
      targets: [],
    } as never)
    expect(summary.blockedBy).toBeUndefined()
    await loader.deactivateAll()
    // 首个用例包含 vitest 冷启动（模块图转换 + 首个 worker 线程），显式放宽超时
  }, 15_000)

  it('清单非法 → failed（AIT-PL-001），不抛错', async () => {
    const { dir } = await writeTestPluginPackage({ id: 'hook.bad', type: 'hook' })
    const loader = await makeLoader()
    const plugin = await loader.activate({
      dir,
      manifest: { id: 'hook.bad', version: '1.0.0', type: 'hook' } as never,
    })
    expect(plugin.state).toBe('failed')
  })

  it('产物哈希不匹配 → failed（AIT-PL-002）', async () => {
    const { dir } = await writeTestPluginPackage({ id: 'hook.tampered', type: 'hook' })
    const { writeFile } = await import('node:fs/promises')
    const raw = JSON.parse(await readFile(join(dir, 'plugin.json'), 'utf8')) as Record<string, unknown>
    const entry = raw.entry as Record<string, unknown>
    entry.sha256 = '0'.repeat(64)
    await writeFile(join(dir, 'plugin.json'), JSON.stringify(raw))
    const loader = await makeLoader()
    const plugin = await loader.activate({ dir: await track(dir), manifest: verifyManifest(raw) })
    expect(plugin.state).toBe('failed')
    expect(plugin.errorCode).toBe(PluginErrorCode.HashMismatch)
  })

  it('adapter 无签名 → failed（AIT-PL-003）', async () => {
    const { dir, manifest } = await writeTestPluginPackage({ id: 'channel.acme', type: 'adapter' })
    const loader = await makeLoader()
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('failed')
    expect(plugin.errorCode).toBe(PluginErrorCode.UntrustedSignature)
  })

  it('adapter 携带受信签名 → 激活成功', async () => {
    const keys = createTestKeyPair()
    const { dir, manifest } = await writeTestPluginPackage({
      id: 'channel.acme',
      type: 'adapter',
      signWithKey: keys.privateKey,
    })
    const loader = await makeLoader({ trustedKeys: [keys.publicKey] })
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('active')
    await loader.deactivateAll()
  })

  it('apiVersion 不兼容 → failed（AIT-PL-004）', async () => {
    const { dir, manifest } = await writeTestPluginPackage({ id: 'hook.v2', type: 'hook', apiVersion: '^2.0.0' })
    const loader = await makeLoader()
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('failed')
    expect(plugin.errorCode).toBe(PluginErrorCode.ApiVersionIncompatible)
  })

  it('engines.aitoearn 不满足宿主版本 → failed', async () => {
    const { dir, manifest } = await writeTestPluginPackage({ id: 'hook.new', type: 'hook', engines: '>=9.0.0' })
    const loader = await makeLoader({ hostVersion: '1.0.0' })
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('failed')
  })

  it('插件激活超时 → failed（AIT-PL-006），不影响其他插件', async () => {
    const slow = await writeTestPluginPackage({
      id: 'hook.slow',
      type: 'hook',
      entrySource: 'await new Promise(() => {})\nexport async function activate() { return { hooks: {} } }\n',
    })
    const fast = await writeTestPluginPackage({
      id: 'hook.fast',
      type: 'hook',
      entrySource: 'export async function activate() { return { hooks: {} } }\n',
    })
    const loader = await makeLoader({ activateTimeoutMs: 300 })
    const results = await Promise.all([
      loader.activate({ dir: await track(slow.dir), manifest: slow.manifest }),
      loader.activate({ dir: await track(fast.dir), manifest: fast.manifest }),
    ])
    const byId = new Map(results.map(plugin => [plugin.manifest.id, plugin]))
    expect(byId.get('hook.slow')?.state).toBe('failed')
    expect(byId.get('hook.slow')?.errorCode).toBe(PluginErrorCode.ActivateTimeout)
    expect(byId.get('hook.fast')?.state).toBe('active')
    await loader.deactivateAll()
  })

  it('卸载全部插件在 1s 内完成（P0-2 回归）', async () => {
    const first = await writeTestPluginPackage({ id: 'hook.alpha', type: 'hook' })
    const second = await writeTestPluginPackage({ id: 'hook.beta', type: 'hook' })
    const loader = await makeLoader()
    await Promise.all([
      loader.activate({ dir: await track(first.dir), manifest: first.manifest }),
      loader.activate({ dir: await track(second.dir), manifest: second.manifest }),
    ])
    const started = Date.now()
    await loader.deactivateAll()
    expect(Date.now() - started).toBeLessThan(1_000)
  })

  it('入口 import node:fs → failed（AIT-PL-001，P0-1 运行时兜底）', async () => {
    const { dir, manifest } = await writeTestPluginPackage({
      id: 'hook.fs',
      type: 'hook',
      entrySource: 'import { readFileSync } from \'node:fs\'\nexport async function activate() { return { hooks: {} } }\n',
    })
    const loader = await makeLoader()
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('failed')
    expect(plugin.errorCode).toBe(PluginErrorCode.InvalidManifest)
  })

  it('插件 import 即崩溃 → failed，宿主继续', async () => {
    const { dir, manifest } = await writeTestPluginPackage({
      id: 'hook.boom',
      type: 'hook',
      entrySource: 'throw new Error("boom at import")\n',
    })
    const loader = await makeLoader()
    const plugin = await loader.activate({ dir: await track(dir), manifest })
    expect(plugin.state).toBe('failed')
    expect(loader.listPlugins()).toHaveLength(1)
  })
})
