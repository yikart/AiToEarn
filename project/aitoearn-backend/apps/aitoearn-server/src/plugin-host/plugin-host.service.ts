import type { ChannelAdapter, PluginManifest, PostDraft, PublishResult } from '@airongrong/plugin-api'
import type { PluginBrokerDeps } from './plugin-host.broker'
import type { HookRunSummary } from './plugin-host.hooks'
import type { LoadedPlugin, PluginLoaderConfig } from './plugin-host.loader'
import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { PluginHookScheduler } from './plugin-host.hooks'
import { PluginHostLoader } from './plugin-host.loader'

export interface PluginStatusView {
  manifest: PluginManifest
  state: string
  error?: string
  errorCode?: string
}

@Injectable()
export class PluginHostService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PluginHostService.name)
  private readonly loader: PluginHostLoader
  private readonly hooks: PluginHookScheduler
  private readonly brokerDeps: PluginBrokerDeps

  constructor(
    private readonly loaderConfig: PluginLoaderConfig,
    brokerDeps: PluginBrokerDeps,
  ) {
    this.brokerDeps = brokerDeps
    this.loader = new PluginHostLoader(loaderConfig, brokerDeps)
    this.hooks = new PluginHookScheduler(this.loader)
  }

  /**
   * 注册插件密钥解析器（默认抛"未配置"）。
   * 必须在插件加载（onApplicationBootstrap）之前调用——broker 创建时拷贝当前 resolveSecret 引用。
   */
  registerSecretResolver(resolver: PluginBrokerDeps['resolveSecret']): void {
    this.brokerDeps.resolveSecret = resolver
  }

  async onApplicationBootstrap(): Promise<void> {
    if (!this.loaderConfig.dir) {
      return
    }
    const plugins = await this.loader.loadAll()
    const activeCount = plugins.filter(plugin => plugin.state === 'active').length
    this.logger.log(`插件加载完成: ${activeCount}/${plugins.length} 个激活`)
  }

  async onApplicationShutdown(): Promise<void> {
    await this.loader.deactivateAll()
  }

  listPlugins(): PluginStatusView[] {
    return this.loader.listPlugins()
  }

  getAdapter(pluginId: string): ChannelAdapter {
    const plugin = this.requireActive(pluginId)
    const channel = plugin.manifest.contributes.channels?.[0]
    const proxy = new Proxy({}, {
      get: (_target, method: string) => {
        if (method === 'then') {
          return undefined
        }
        if (method === 'meta') {
          return channel ? { id: channel.id, label: channel.label, capabilities: channel.capabilities } : undefined
        }
        return (...params: unknown[]) => plugin.sandbox!.invoke(`adapter.${method}`, params)
      },
    })
    return proxy as unknown as ChannelAdapter
  }

  async runValidateDraft(draft: PostDraft): Promise<HookRunSummary> {
    return this.hooks.runValidateDraft(draft)
  }

  async runBeforePublish(draft: PostDraft): Promise<HookRunSummary> {
    return this.hooks.runBeforePublish(draft)
  }

  async runAfterPublish(result: PublishResult): Promise<void> {
    return this.hooks.runAfterPublish(result)
  }

  private requireActive(pluginId: string): LoadedPlugin {
    const plugin = this.loader.get(pluginId)
    if (!plugin || plugin.state !== 'active' || !plugin.sandbox) {
      throw new Error(`插件不可用: ${pluginId}`)
    }
    return plugin
  }
}
