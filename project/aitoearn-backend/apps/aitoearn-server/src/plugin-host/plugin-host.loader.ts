import type { PluginManifest } from '@airongrong/plugin-api'
import type { PluginAuditEntry, PluginBrokerDeps } from './plugin-host.broker'
import type { DiscoveredPlugin } from './plugin-host.registry'
import type { FsIsolationMode } from './plugin-host.sandbox'
import { createHash, verify as verifySignature } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  assertPluginEntrySource,
  isApiCompatible,
  PluginError,
  PluginErrorCode,

  PluginType,
  satisfiesVersion,
  verifyManifest,
} from '@airongrong/plugin-api'
import { Injectable, Logger } from '@nestjs/common'
import { PluginHostBroker } from './plugin-host.broker'
import { PluginHostRegistry } from './plugin-host.registry'
import { PluginSandbox } from './plugin-host.sandbox'

export type PluginState = 'active' | 'failed'

export interface LoadedPlugin {
  manifest: PluginManifest
  state: PluginState
  error?: string
  errorCode?: PluginErrorCode
  sandbox?: PluginSandbox
}

export interface PluginLoaderConfig {
  dir: string
  trustedKeys: string[]
  hostVersion: string
  /** 测试可缩短激活超时 */
  activateTimeoutMs?: number
  /** 文件系统隔离策略，默认 auto */
  fsIsolation?: FsIsolationMode
}

const ACTIVATE_TIMEOUT_MS = 5_000
const DEACTIVATE_TIMEOUT_MS = 3_000

/**
 * 校验 → 加载 → 激活。任一阶段失败将插件标记 failed，绝不阻断宿主启动。
 */
@Injectable()
export class PluginHostLoader {
  private readonly logger = new Logger(PluginHostLoader.name)
  private readonly registry = new PluginHostRegistry()
  private readonly plugins = new Map<string, LoadedPlugin>()

  constructor(
    private readonly config: PluginLoaderConfig,
    private readonly brokerDeps: PluginBrokerDeps,
  ) {}

  async loadAll(): Promise<LoadedPlugin[]> {
    const scan = await this.registry.scan(this.config.dir)
    const latest = this.registry.resolveLatest(scan.plugins)
    for (const discovered of latest.values()) {
      await this.activate(discovered).catch((error: Error) => {
        this.logger.error(`插件加载失败: ${discovered.manifest.id}: ${error.message}`)
      })
    }
    return this.listPlugins()
  }

  async activate(discovered: DiscoveredPlugin): Promise<LoadedPlugin> {
    const { dir, manifest } = discovered
    try {
      const moduleBytes = await this.assertEntry(dir, manifest)
      this.assertSignature(manifest, moduleBytes)
      this.assertCompatibility(manifest)
      const loaded = await this.spawn(manifest, dir)
      this.plugins.set(manifest.id, loaded)
      this.logger.log({ pluginId: manifest.id }, 'Plugin activated')
      return loaded
    }
    catch (error) {
      const loaded: LoadedPlugin = {
        manifest,
        state: 'failed',
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof PluginError ? error.code : PluginErrorCode.InvalidManifest,
      }
      this.plugins.set(manifest.id, loaded)
      return loaded
    }
  }

  get(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  listPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  /** 并行卸载：仅对实现了 deactivate 的插件调用，其余直接 terminate（P0-2） */
  async deactivateAll(): Promise<void> {
    await Promise.all(Array.from(this.plugins.values()).map(async (plugin) => {
      const sandbox = plugin.sandbox
      if (!sandbox) {
        return
      }
      if (sandbox.hasMethod('deactivate')) {
        try {
          await sandbox.invoke('deactivate', [], { timeoutMs: DEACTIVATE_TIMEOUT_MS })
        }
        catch {
          // deactivate 失败不再等待，直接终止 worker
        }
      }
      await sandbox.stop()
    }))
    this.plugins.clear()
  }

  get auditTrail(): PluginAuditEntry[] {
    return this.brokerAudit
  }

  private readonly brokerAudit: PluginAuditEntry[] = []

  private async assertEntry(dir: string, manifest: PluginManifest): Promise<Buffer> {
    const modulePath = manifest.entry!.module.replace(/^\.\//, '')
    const moduleBytes = await readFile(join(dir, modulePath))
    const actual = createHash('sha256').update(moduleBytes).digest('hex')
    if (actual !== manifest.entry!.sha256) {
      throw new PluginError(
        PluginErrorCode.HashMismatch,
        `产物哈希不匹配: 期望 ${manifest.entry!.sha256}，实际 ${actual}`,
      )
    }
    // 运行时同样执行入口源码约束，杜绝 node:fs / node:child_process 绕过权限代理（P0-1）
    assertPluginEntrySource(moduleBytes.toString('utf8'), modulePath)
    return moduleBytes
  }

  private assertSignature(manifest: PluginManifest, moduleBytes: Buffer): void {
    if (manifest.type !== PluginType.Adapter) {
      return
    }
    if (!manifest.signature) {
      throw new PluginError(PluginErrorCode.UntrustedSignature, 'adapter 插件必须携带签名')
    }
    const trustedKey = this.config.trustedKeys.find((key) => {
      try {
        return verifySignature(
          null,
          Buffer.from(createHash('sha256').update(moduleBytes).digest('hex')),
          key,
          Buffer.from(manifest.signature!, 'base64'),
        )
      }
      catch {
        return false
      }
    })
    if (!trustedKey) {
      throw new PluginError(PluginErrorCode.UntrustedSignature, '签名无效或发布者未受信')
    }
  }

  private assertCompatibility(manifest: PluginManifest): void {
    if (!isApiCompatible(manifest.apiVersion)) {
      throw new PluginError(
        PluginErrorCode.ApiVersionIncompatible,
        `apiVersion ${manifest.apiVersion} 与宿主不兼容，请升级插件或宿主`,
      )
    }
    if (!satisfiesVersion(this.config.hostVersion, manifest.engines.aitoearn)) {
      throw new PluginError(
        PluginErrorCode.ApiVersionIncompatible,
        `宿主版本 ${this.config.hostVersion} 不满足插件要求 ${manifest.engines.aitoearn}，请升级宿主`,
      )
    }
  }

  private async spawn(manifest: PluginManifest, dir: string): Promise<LoadedPlugin> {
    const audit = (entry: PluginAuditEntry) => {
      this.brokerAudit.push(entry)
    }
    const broker = new PluginHostBroker(manifest, { ...this.brokerDeps, audit })
    const sandbox = new PluginSandbox(
      manifest.id,
      dir,
      manifest.entry!.module,
      broker,
      this.config.fsIsolation ?? 'auto',
    )
    await sandbox.start(this.config.activateTimeoutMs ?? ACTIVATE_TIMEOUT_MS)
    return { manifest, state: 'active', sandbox }
  }
}

export { verifyManifest }
