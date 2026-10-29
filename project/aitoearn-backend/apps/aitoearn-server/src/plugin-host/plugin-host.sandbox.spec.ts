import type { PluginHostBroker } from './plugin-host.broker'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildWorkerExecArgv, PluginSandbox, supportsPermissionModel } from './plugin-host.sandbox'

const tmpDirs: string[] = []

async function writePackage(id: string, entrySource: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'ait-sandbox-'))
  const dir = join(root, id)
  await mkdir(join(dir, 'dist'), { recursive: true })
  await writeFile(join(dir, 'dist', 'index.mjs'), entrySource)
  tmpDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('buildWorkerExecArgv', () => {
  it('off → 不带权限参数', () => {
    expect(buildWorkerExecArgv('/tmp/plug', 'off')).toEqual([])
  })

  it('on/auto 且 Node 支持时启用 permission model 并限定插件目录', () => {
    if (!supportsPermissionModel()) {
      return
    }
    const argv = buildWorkerExecArgv('/tmp/plug', 'on')
    expect(argv).toContain('--permission')
    expect(argv.some(item => item.startsWith('--allow-fs-read='))).toBe(true)
    expect(argv.some(item => item.startsWith('--allow-fs-write='))).toBe(false)
    expect(argv.some(item => item.startsWith('--allow-child-process'))).toBe(false)
  })

  it('on 但 Node 不支持 → 直接拒绝加载（AIT-PL-005）', () => {
    if (supportsPermissionModel()) {
      return
    }
    expect(() => buildWorkerExecArgv('/tmp/plug', 'on')).toThrow(/--permission/)
  })
})

describe('pluginHostSandbox 文件系统隔离', () => {
  const FS_READ_SOURCE = `export async function activate() {
    return {
      async readOutside() {
        const fs = await import('node:fs')
        return fs.readFileSync('/etc/hosts', 'utf8')
      },
    }
  }
`

  async function startSandbox(dir: string, fsIsolation: 'auto' | 'on' | 'off') {
    const sandbox = new PluginSandbox(
      'hook.fs-test',
      dir,
      './dist/index.mjs',
      {} as unknown as PluginHostBroker,
      fsIsolation,
    )
    await sandbox.start(3_000)
    return sandbox
  }

  it('开启隔离后读取插件目录外文件被拒绝（P0-1）', async () => {
    if (!supportsPermissionModel()) {
      return
    }
    const dir = await writePackage('hook.fs-on', FS_READ_SOURCE)
    const sandbox = await startSandbox(dir, 'on')
    await expect(sandbox.invoke('readOutside')).rejects.toThrow()
    await sandbox.stop()
  }, 15_000)

  it('关闭隔离时行为不变（回归基线）', async () => {
    const dir = await writePackage('hook.fs-off', FS_READ_SOURCE)
    const sandbox = await startSandbox(dir, 'off')
    const content = await sandbox.invoke<string>('readOutside')
    expect(typeof content).toBe('string')
    await sandbox.stop()
  }, 15_000)

  it('ready 上报 methods，未实现的方法可被跳过（P0-2）', async () => {
    const dir = await writePackage('hook.methods', 'export async function activate() { return { hooks: {} } }\n')
    const sandbox = await startSandbox(dir, 'off')
    expect(sandbox.hasMethod('deactivate')).toBe(false)
    expect(sandbox.hasMethod('hooks')).toBe(true)
    await sandbox.stop()
  }, 15_000)

  it('stop() 立即终止，无需等待 deactivate', async () => {
    const dir = await writePackage('hook.stop', 'export async function activate() { return { hooks: {} } }\n')
    const sandbox = await startSandbox(dir, 'off')
    const started = Date.now()
    await sandbox.stop()
    expect(Date.now() - started).toBeLessThan(1_000)
    expect(await readFile(join(dir, 'dist', 'index.mjs'), 'utf8')).toContain('activate')
  }, 15_000)
})
