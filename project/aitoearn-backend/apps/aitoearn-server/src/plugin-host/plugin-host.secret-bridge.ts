import type { CredentialService } from '../core/channels/accounts/credential.service'
import type { PluginHostService } from './plugin-host.service'
import { PluginError, PluginErrorCode } from '@airongrong/plugin-api'
import { Injectable, Logger } from '@nestjs/common'

/** 插件可声明的密钥键（permissions.secrets），与 capability/capability.yaml 同源 */
export const PLUGIN_SECRET_KEYS = {
  oauthAccessToken: 'oauth.access_token',
  oauthRefreshToken: 'oauth.refresh_token',
} as const

/**
 * 插件密钥 → 账号凭据体系桥接（复审 A 组：resolveSecret 断头路）。
 * 只允许白名单键，按 pluginId + accountId 分区取 OAuth2Credential，插件拿不到明文之外的宿主数据。
 *
 * 注册放在构造函数而非 bootstrap 钩子：插件沙箱的 broker 在加载时拷贝 resolveSecret 引用，
 * 必须赶在 PluginHostService.onApplicationBootstrap 加载插件之前完成。
 */
@Injectable()
export class PluginSecretBridge {
  private readonly logger = new Logger(PluginSecretBridge.name)

  constructor(
    pluginHost: PluginHostService,
    private readonly credentials: CredentialService,
  ) {
    pluginHost.registerSecretResolver(async (pluginId, key, accountId) => {
      const secret = await this.resolve(pluginId, key, accountId)
      this.logger.log(`插件 ${pluginId} 使用密钥 ${key}（账号 ${accountId ?? '无'}）`)
      return secret
    })
  }

  private async resolve(pluginId: string, key: string, accountId?: string): Promise<string> {
    if (!accountId) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `插件 ${pluginId} 请求密钥 ${key} 但未提供 accountId，无法定位凭据`,
        { pluginId, key },
      )
    }
    if (key !== PLUGIN_SECRET_KEYS.oauthAccessToken && key !== PLUGIN_SECRET_KEYS.oauthRefreshToken) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `插件 ${pluginId} 请求了未在白名单中的密钥键: ${key}`,
        { pluginId, key },
      )
    }
    const credential = await this.credentials.getCredential(accountId)
    if (!credential) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `插件 ${pluginId} 请求密钥 ${key}，但账号 ${accountId} 没有可用凭据`,
        { pluginId, key, accountId },
      )
    }
    if (key === PLUGIN_SECRET_KEYS.oauthAccessToken) {
      return credential.accessToken
    }
    if (!credential.refreshToken) {
      throw new PluginError(
        PluginErrorCode.PermissionViolation,
        `插件 ${pluginId} 请求密钥 ${key}，但账号 ${accountId} 无 refreshToken`,
        { pluginId, key, accountId },
      )
    }
    return credential.refreshToken
  }
}
