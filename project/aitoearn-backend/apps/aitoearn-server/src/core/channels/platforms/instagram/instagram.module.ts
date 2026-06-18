import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { InstagramAnalyticsProvider } from './instagram-analytics.provider'
import { InstagramAuthProvider } from './instagram-auth.provider'
import { InstagramEngagementProvider } from './instagram-engagement.provider'
import { InstagramPublishProvider } from './instagram-publish.provider'
import { InstagramWebhookProvider } from './instagram-webhook.provider'
import { InstagramWorkProvider } from './instagram-work.provider'
import { InstagramConfig } from './instagram.config'
import { INSTAGRAM_METADATA } from './instagram.constants'
import { InstagramService } from './instagram.service'

@Module({})
export class InstagramModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: InstagramModule }
    }

    const metadata = { ...INSTAGRAM_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: InstagramModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'INSTAGRAM_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: INSTAGRAM_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as InstagramConfig

    return {
      module: InstagramModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: InstagramConfig, useValue: availableConfig },
        InstagramService,
        InstagramAuthProvider,
        InstagramPublishProvider,
        InstagramAnalyticsProvider,
        InstagramEngagementProvider,
        InstagramWorkProvider,
        InstagramWebhookProvider,
        {
          provide: 'INSTAGRAM_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            InstagramAuthProvider,
            InstagramPublishProvider,
            InstagramAnalyticsProvider,
            InstagramEngagementProvider,
            InstagramWorkProvider,
            InstagramWebhookProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: InstagramAuthProvider,
            publish: InstagramPublishProvider,
            analytics: InstagramAnalyticsProvider,
            engagement: InstagramEngagementProvider,
            work: InstagramWorkProvider,
            webhook: InstagramWebhookProvider,
          ) => {
            registry.register({
              platform: INSTAGRAM_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              analytics,
              engagement,
              work,
              webhook,
            })
          },
        },
      ],
      exports: [
        InstagramService,
        InstagramAuthProvider,
        InstagramPublishProvider,
        InstagramAnalyticsProvider,
        InstagramEngagementProvider,
        InstagramWorkProvider,
        InstagramWebhookProvider,
      ],
    }
  }
}
