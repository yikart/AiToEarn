import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../../platforms.config'
import { PlatformIntegrationRegistry } from '../../platforms.registry'
import { PlatformRegistryModule } from '../../platforms.registry.module'
import { WechatChannelsConfig, WechatConfig } from '../wechat.config'
import { WeChatService } from '../wechat.service'
import { WeChatChannelsPublishProvider } from './wechat-channels-publish.provider'
import { WeChatChannelsWorkProvider } from './wechat-channels-work.provider'
import { WECHAT_CHANNELS_METADATA } from './wechat-channels.constants'

@Module({})
export class WeChatChannelsModule {
  static forRoot(config: PlatformConfigWithStatus | undefined, wechatConfig: WechatConfig): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: WeChatChannelsModule }
    }

    const metadata = { ...WECHAT_CHANNELS_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: WeChatChannelsModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'WECHAT_CHANNELS_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: WECHAT_CHANNELS_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as WechatChannelsConfig

    return {
      module: WeChatChannelsModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: WechatChannelsConfig, useValue: availableConfig },
        { provide: WechatConfig, useValue: wechatConfig },
        WeChatService,
        WeChatChannelsPublishProvider,
        WeChatChannelsWorkProvider,
        {
          provide: 'WECHAT_CHANNELS_INTEGRATION',
          inject: [PlatformIntegrationRegistry, WeChatChannelsPublishProvider, WeChatChannelsWorkProvider],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            publish: WeChatChannelsPublishProvider,
            work: WeChatChannelsWorkProvider,
          ) => {
            registry.register({
              platform: WECHAT_CHANNELS_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              publish,
              work,
            })
          },
        },
      ],
      exports: [
        WeChatService,
        WeChatChannelsPublishProvider,
        WeChatChannelsWorkProvider,
      ],
    }
  }
}
