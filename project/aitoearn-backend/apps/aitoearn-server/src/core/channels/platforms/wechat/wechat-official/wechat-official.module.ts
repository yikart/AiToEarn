import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../../platforms.config'
import { PlatformIntegrationRegistry } from '../../platforms.registry'
import { PlatformRegistryModule } from '../../platforms.registry.module'
import { WechatConfig, WechatOfficialConfig } from '../wechat.config'
import { WeChatService } from '../wechat.service'
import { WeChatOfficialAuthProvider } from './wechat-official-auth.provider'
import { WeChatOfficialPublishProvider } from './wechat-official-publish.provider'
import { WeChatOfficialWebhookProvider } from './wechat-official-webhook.provider'
import { WECHAT_OFFICIAL_METADATA } from './wechat-official.constants'

@Module({})
export class WeChatOfficialModule {
  static forRoot(config: PlatformConfigWithStatus | undefined, wechatConfig: WechatConfig): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: WeChatOfficialModule }
    }

    const metadata = { ...WECHAT_OFFICIAL_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: WeChatOfficialModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'WECHAT_OFFICIAL_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: WECHAT_OFFICIAL_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as WechatOfficialConfig

    return {
      module: WeChatOfficialModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: WechatOfficialConfig, useValue: availableConfig },
        { provide: WechatConfig, useValue: wechatConfig },
        WeChatService,
        WeChatOfficialAuthProvider,
        WeChatOfficialPublishProvider,
        WeChatOfficialWebhookProvider,
        {
          provide: 'WECHAT_OFFICIAL_INTEGRATION',
          inject: [PlatformIntegrationRegistry, WeChatOfficialAuthProvider, WeChatOfficialPublishProvider, WeChatOfficialWebhookProvider],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: WeChatOfficialAuthProvider,
            publish: WeChatOfficialPublishProvider,
            webhook: WeChatOfficialWebhookProvider,
          ) => {
            registry.register({
              platform: WECHAT_OFFICIAL_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              webhook,
            })
          },
        },
      ],
      exports: [
        WeChatService,
        WeChatOfficialAuthProvider,
        WeChatOfficialPublishProvider,
        WeChatOfficialWebhookProvider,
      ],
    }
  }
}
