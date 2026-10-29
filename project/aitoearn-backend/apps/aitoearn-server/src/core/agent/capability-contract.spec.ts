import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadCapabilityManifest } from '@airongrong/capability'
import { describe, expect, it } from 'vitest'

// 宿主能力清单是单一事实源：契约名与写操作护栏约定冻结在这里，
// SDK（yikart/aitoearn-sdk）只负责解析与派生，不持有宿主清单。
const MANIFEST_PATH = join(__dirname, '../../../../..', 'capability', 'capability.yaml')
const CORE_IMPLEMENTED = [
  'list_accounts',
  'create_draft',
  'publish_post',
  'schedule_post',
  'list_posts',
  'get_metrics',
]
const FROZEN_ACTIONS = [
  'list_accounts',
  'hot_topics',
  'create_draft',
  'validate_content',
  'publish_post',
  'schedule_post',
  'list_posts',
  'get_metrics',
  'revoke_post',
  'list_earn_tasks',
  'accept_earn_task',
  'submit_earn_task',
]

describe('capability.yaml 唯一事实源', () => {
  it('仓库内存在可解析的能力清单', async () => {
    expect(existsSync(MANIFEST_PATH)).toBe(true)
    const manifest = await loadCapabilityManifest(MANIFEST_PATH)

    expect(Object.keys(manifest.actions).length).toBeGreaterThanOrEqual(12)
    // 契约名冻结：一个不能少、顺序不能变
    expect(Object.keys(manifest.actions)).toEqual(FROZEN_ACTIONS)

    // 写操作必须要求确认，否则护栏会被绕过（AIT-AG-002）
    const writes = Object.values(manifest.actions).filter(action => action.sideEffect === 'write')
    expect(writes.length).toBeGreaterThan(0)
    expect(writes.every(action => action.confirm === 'required')).toBe(true)

    // 已实现契约必须标注 backend 映射，占位契约必须没有（防止"假实现"）
    for (const [name, action] of Object.entries(manifest.actions)) {
      expect(Boolean(action.backend)).toBe(CORE_IMPLEMENTED.includes(name))
    }
  })
})
