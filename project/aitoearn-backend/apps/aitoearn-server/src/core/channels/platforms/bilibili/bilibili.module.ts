import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { BilibiliAnalyticsProvider } from './bilibili-analytics.provider'
import { BilibiliAuthProvider } from './bilibili-auth.provider'
import { BilibiliPublishOptionsProvider } from './bilibili-publish-options.provider'
import { BilibiliPublishProvider } from './bilibili-publish.provider'
import { BilibiliWebhookProvider } from './bilibili-webhook.provider'
import { BilibiliWorkProvider } from './bilibili-work.provider'
import { BilibiliConfig } from './bilibili.config'
import { BILIBILI_METADATA } from './bilibili.constants'
import { BilibiliService } from './bilibili.service'

@Module({})
export class BilibiliModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: BilibiliModule }
    }

    const metadata = { ...BILIBILI_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: BilibiliModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'BILIBILI_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: BILIBILI_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as BilibiliConfig

    return {
      module: BilibiliModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: BilibiliConfig, useValue: availableConfig },
        BilibiliService,
        BilibiliAuthProvider,
        BilibiliPublishProvider,
        BilibiliPublishOptionsProvider,
        BilibiliAnalyticsProvider,
        BilibiliWebhookProvider,
        BilibiliWorkProvider,
        {
          provide: 'BILIBILI_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            BilibiliAuthProvider,
            BilibiliPublishProvider,
            BilibiliPublishOptionsProvider,
            BilibiliAnalyticsProvider,
            BilibiliWebhookProvider,
            BilibiliWorkProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: BilibiliAuthProvider,
            publish: BilibiliPublishProvider,
            publishOptions: BilibiliPublishOptionsProvider,
            analytics: BilibiliAnalyticsProvider,
            webhook: BilibiliWebhookProvider,
            work: BilibiliWorkProvider,
          ) => {
            registry.register({
              platform: BILIBILI_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              publishOptions,
              analytics,
              webhook,
              work,
            })
          },
        },
      ],
      exports: [
        BilibiliConfig,
        BilibiliService,
        BilibiliAuthProvider,
        BilibiliPublishProvider,
        BilibiliPublishOptionsProvider,
        BilibiliAnalyticsProvider,
        BilibiliWebhookProvider,
        BilibiliWorkProvider,
      ],
    }
  }
}
