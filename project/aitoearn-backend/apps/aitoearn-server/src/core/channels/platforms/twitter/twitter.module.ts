import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { TwitterAnalyticsProvider } from './twitter-analytics.provider'
import { TwitterAuthProvider } from './twitter-auth.provider'
import { TwitterEngagementProvider } from './twitter-engagement.provider'
import { TwitterPublishProvider } from './twitter-publish.provider'
import { TwitterWorkProvider } from './twitter-work.provider'
import { TwitterConfig } from './twitter.config'
import { TWITTER_METADATA } from './twitter.constants'
import { TwitterService } from './twitter.service'

@Module({})
export class TwitterModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: TwitterModule }
    }

    const metadata = { ...TWITTER_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: TwitterModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'TWITTER_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: TWITTER_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as TwitterConfig

    return {
      module: TwitterModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: TwitterConfig, useValue: availableConfig },
        TwitterService,
        TwitterAuthProvider,
        TwitterPublishProvider,
        TwitterAnalyticsProvider,
        TwitterEngagementProvider,
        TwitterWorkProvider,
        {
          provide: 'TWITTER_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            TwitterAuthProvider,
            TwitterPublishProvider,
            TwitterAnalyticsProvider,
            TwitterEngagementProvider,
            TwitterWorkProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: TwitterAuthProvider,
            publish: TwitterPublishProvider,
            analytics: TwitterAnalyticsProvider,
            engagement: TwitterEngagementProvider,
            work: TwitterWorkProvider,
          ) => {
            registry.register({
              platform: TWITTER_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              analytics,
              engagement,
              work,
            })
          },
        },
      ],
      exports: [
        TwitterService,
        TwitterAuthProvider,
        TwitterPublishProvider,
        TwitterAnalyticsProvider,
        TwitterEngagementProvider,
        TwitterWorkProvider,
      ],
    }
  }
}
