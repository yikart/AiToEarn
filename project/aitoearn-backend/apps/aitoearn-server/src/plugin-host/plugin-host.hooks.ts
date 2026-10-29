import type { PostDraft, PublishResult, ValidationIssue } from '@airongrong/plugin-api'
import type { LoadedPlugin, PluginHostLoader } from './plugin-host.loader'
import {
  PluginError,
  PluginErrorCode,
  PluginHookName,

  ValidationIssueSeverity,
} from '@airongrong/plugin-api'
import { Injectable, Logger } from '@nestjs/common'

const HOOK_TIMEOUT_MS = 2_000

export interface HookRunSummary {
  issues: ValidationIssue[]
  /** fail-closed 钩子中止时给出拒绝原因 */
  blockedBy?: { pluginId: string, reason: string }
}

/**
 * 钩子调度：validateDraft / beforePublish(fail-closed) / afterPublish(fail-open) / onAuthExpired。
 * 单个插件崩溃只影响该插件的钩子结果，不影响其他插件与宿主主流程。
 */
@Injectable()
export class PluginHookScheduler {
  private readonly logger = new Logger(PluginHookScheduler.name)

  constructor(private readonly loader: PluginHostLoader) {}

  async runValidateDraft(draft: PostDraft): Promise<HookRunSummary> {
    const summary: HookRunSummary = { issues: [] }
    for (const plugin of this.activeHookPlugins(PluginHookName.ValidateDraft)) {
      try {
        const issues = await plugin.sandbox!.invoke<ValidationIssue[]>('hooks.validateDraft', [draft], { timeoutMs: HOOK_TIMEOUT_MS })
        summary.issues.push(...(issues ?? []))
      }
      catch (error) {
        this.logHookFailure(plugin, PluginHookName.ValidateDraft, error)
        summary.issues.push({ severity: ValidationIssueSeverity.Warning, message: `校验插件 ${plugin.manifest.id} 执行失败` })
      }
    }
    return summary
  }

  async runBeforePublish(draft: PostDraft): Promise<HookRunSummary> {
    const summary: HookRunSummary = { issues: [] }
    for (const plugin of this.activeHookPlugins(PluginHookName.BeforePublish)) {
      try {
        await plugin.sandbox!.invoke('hooks.beforePublish', [draft], { timeoutMs: HOOK_TIMEOUT_MS })
      }
      catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        this.logHookFailure(plugin, PluginHookName.BeforePublish, error)
        throw new PluginError(
          PluginErrorCode.HookRejected,
          `校验插件拒绝发布（${plugin.manifest.id}）: ${reason}`,
          { pluginId: plugin.manifest.id },
        )
      }
    }
    return summary
  }

  async runAfterPublish(result: PublishResult): Promise<void> {
    for (const plugin of this.activeHookPlugins(PluginHookName.AfterPublish)) {
      try {
        await plugin.sandbox!.invoke('hooks.afterPublish', [result], { timeoutMs: HOOK_TIMEOUT_MS })
      }
      catch (error) {
        // fail-open：只记日志
        this.logHookFailure(plugin, PluginHookName.AfterPublish, error)
      }
    }
  }

  async runOnAuthExpired(ctx: { accountId: string, channelId: string }): Promise<void> {
    for (const plugin of this.activeHookPlugins(PluginHookName.OnAuthExpired)) {
      try {
        await plugin.sandbox!.invoke('hooks.onAuthExpired', [ctx], { timeoutMs: HOOK_TIMEOUT_MS })
      }
      catch (error) {
        this.logHookFailure(plugin, PluginHookName.OnAuthExpired, error)
      }
    }
  }

  private activeHookPlugins(hook: PluginHookName): LoadedPlugin[] {
    return this.loader.listPlugins().filter(
      plugin => plugin.state === 'active'
        && plugin.manifest.contributes.hooks?.includes(hook)
        && plugin.sandbox,
    )
  }

  private logHookFailure(plugin: LoadedPlugin, hook: PluginHookName, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    this.logger.warn(`钩子执行失败: ${plugin.manifest.id}.${hook}: ${message}`)
  }
}
