import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { YoutubeAnalyticsProvider } from './youtube-analytics.provider'
import { YoutubeAuthProvider } from './youtube-auth.provider'
import { YoutubeEngagementProvider } from './youtube-engagement.provider'
import { YoutubePublishOptionsProvider } from './youtube-publish-options.provider'
import { YoutubePublishProvider } from './youtube-publish.provider'
import { YoutubeWebhookProvider } from './youtube-webhook.provider'
import { YoutubeWorkProvider } from './youtube-work.provider'
import { YoutubeConfig } from './youtube.config'
import { YOUTUBE_METADATA } from './youtube.constants'
import { YoutubeService } from './youtube.service'

@Module({})
export class YoutubeModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: YoutubeModule }
    }

    const metadata = { ...YOUTUBE_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: YoutubeModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'YOUTUBE_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: YOUTUBE_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as YoutubeConfig

    return {
      module: YoutubeModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: YoutubeConfig, useValue: availableConfig },
        YoutubeService,
        YoutubeAuthProvider,
        YoutubePublishProvider,
        YoutubePublishOptionsProvider,
        YoutubeAnalyticsProvider,
        YoutubeEngagementProvider,
        YoutubeWorkProvider,
        YoutubeWebhookProvider,
        {
          provide: 'YOUTUBE_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            YoutubeAuthProvider,
            YoutubePublishProvider,
            YoutubePublishOptionsProvider,
            YoutubeAnalyticsProvider,
            YoutubeEngagementProvider,
            YoutubeWorkProvider,
            YoutubeWebhookProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: YoutubeAuthProvider,
            publish: YoutubePublishProvider,
            publishOptions: YoutubePublishOptionsProvider,
            analytics: YoutubeAnalyticsProvider,
            engagement: YoutubeEngagementProvider,
            work: YoutubeWorkProvider,
            webhook: YoutubeWebhookProvider,
          ) => {
            registry.register({
              platform: YOUTUBE_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              publishOptions,
              analytics,
              engagement,
              work,
              webhook,
            })
          },
        },
      ],
      exports: [
        YoutubeConfig,
        YoutubeService,
        YoutubeAuthProvider,
        YoutubePublishProvider,
        YoutubePublishOptionsProvider,
        YoutubeAnalyticsProvider,
        YoutubeEngagementProvider,
        YoutubeWorkProvider,
        YoutubeWebhookProvider,
      ],
    }
  }
}
