import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { TikTokAnalyticsProvider } from './tiktok-analytics.provider'
import { TikTokAuthProvider } from './tiktok-auth.provider'
import { TikTokPublishProvider } from './tiktok-publish.provider'
import { TikTokWebhookProvider } from './tiktok-webhook.provider'
import { TikTokWorkProvider } from './tiktok-work.provider'
import { TiktokConfig } from './tiktok.config'
import { TIKTOK_METADATA } from './tiktok.constants'
import { TikTokService } from './tiktok.service'

@Module({})
export class TiktokModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: TiktokModule }
    }

    const metadata = { ...TIKTOK_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: TiktokModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'TIKTOK_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: TIKTOK_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as TiktokConfig

    return {
      module: TiktokModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: TiktokConfig, useValue: availableConfig },
        TikTokService,
        TikTokAuthProvider,
        TikTokPublishProvider,
        TikTokAnalyticsProvider,
        TikTokWorkProvider,
        TikTokWebhookProvider,
        {
          provide: 'TIKTOK_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            TikTokAuthProvider,
            TikTokPublishProvider,
            TikTokAnalyticsProvider,
            TikTokWorkProvider,
            TikTokWebhookProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: TikTokAuthProvider,
            publish: TikTokPublishProvider,
            analytics: TikTokAnalyticsProvider,
            work: TikTokWorkProvider,
            webhook: TikTokWebhookProvider,
          ) => {
            registry.register({
              platform: TIKTOK_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              analytics,
              work,
              webhook,
            })
          },
        },
      ],
      exports: [
        TikTokService,
        TikTokAuthProvider,
        TikTokPublishProvider,
        TikTokAnalyticsProvider,
        TikTokWorkProvider,
        TikTokWebhookProvider,
      ],
    }
  }
}
