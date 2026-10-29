import { rm } from 'node:fs/promises'
import { PluginErrorCode } from '@airongrong/plugin-api'
import { afterEach, describe, expect, it } from 'vitest'
import { PluginHookScheduler } from './plugin-host.hooks'
import { InMemoryPluginKvStore } from './plugin-host.kv-store'
import { PluginHostLoader } from './plugin-host.loader'
import { PluginHostRegistry } from './plugin-host.registry'
import { writeTestPluginPackage } from './plugin-host.testing'

const tmpDirs: string[] = []

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

async function makeScheduler(entrySource: string): Promise<PluginHookScheduler> {
  const { dir } = await writeTestPluginPackage({
    id: 'hook.guard',
    type: 'hook',
    hooks: ['validateDraft', 'beforePublish', 'afterPublish'],
    entrySource,
  })
  tmpDirs.push(dir)
  const loader = new PluginHostLoader(
    { dir: '', trustedKeys: [], hostVersion: '1.0.0' },
    { resolveSecret: async () => '', kvStore: new InMemoryPluginKvStore() },
  )
  const scan = await new PluginHostRegistry().scan(dir.slice(0, dir.lastIndexOf('/')))
  const discovered = scan.plugins[0]
  const plugin = await loader.activate(discovered)
  expect(plugin.state).toBe('active')
  return new PluginHookScheduler(loader)
}

const draft = {
  draftId: 'd-1',
  text: 'hello 违禁词',
  blocks: [],
  topics: [],
  mentions: [],
  visibility: 'public' as const,
  locale: 'zh-CN',
}

describe('pluginHookScheduler', () => {
  it('beforePublish fail-closed：抛错即中止并透传原因（AIT-PL-007）', async () => {
    const scheduler = await makeScheduler(`export async function activate() {
      return { hooks: { async beforePublish(d) { if (d.text.includes('违禁')) throw new Error('包含违禁词') } } }
    }`)
    await expect(scheduler.runBeforePublish(draft)).rejects.toMatchObject({
      code: PluginErrorCode.HookRejected,
      message: expect.stringContaining('包含违禁词'),
    })
  })

  it('beforePublish 通过时不抛错', async () => {
    const scheduler = await makeScheduler(`export async function activate() {
      return { hooks: { async beforePublish() {} } }
    }`)
    await expect(scheduler.runBeforePublish({ ...draft, text: '正常内容' })).resolves.toEqual({ issues: [] })
  })

  it('afterPublish fail-open：抛错只记日志', async () => {
    const scheduler = await makeScheduler(`export async function activate() {
      return { hooks: { async afterPublish() { throw new Error('after boom') } } }
    }`)
    await expect(scheduler.runAfterPublish({ externalId: 'x', url: 'u', publishedAt: new Date().toISOString() }))
      .resolves
      .toBeUndefined()
  })

  it('validateDraft 聚合 issue', async () => {
    const scheduler = await makeScheduler(`export async function activate() {
      return { hooks: { async validateDraft() { return [{ severity: 'error', message: '图片超限' }] } } }
    }`)
    const summary = await scheduler.runValidateDraft(draft)
    expect(summary.issues).toEqual([{ severity: 'error', message: '图片超限' }])
  })

  it('beforePublish 钩子超时按拒绝处理（fail-closed）', async () => {
    const scheduler = await makeScheduler(`export async function activate() {
      return { hooks: { async beforePublish() { await new Promise(() => {}) } } }
    }`)
    await expect(scheduler.runBeforePublish({ ...draft, text: '正常' })).rejects.toMatchObject({
      code: PluginErrorCode.HookRejected,
    })
  })
})
