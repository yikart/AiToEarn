import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { FacebookAnalyticsProvider } from './facebook-analytics.provider'
import { FacebookAuthProvider } from './facebook-auth.provider'
import { FacebookEngagementProvider } from './facebook-engagement.provider'
import { FacebookPublishProvider } from './facebook-publish.provider'
import { FacebookWebhookProvider } from './facebook-webhook.provider'
import { FacebookWorkProvider } from './facebook-work.provider'
import { FacebookConfig } from './facebook.config'
import { FACEBOOK_METADATA } from './facebook.constants'
import { FacebookService } from './facebook.service'

@Module({})
export class FacebookModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: FacebookModule }
    }

    const metadata = { ...FACEBOOK_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: FacebookModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'FACEBOOK_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: FACEBOOK_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as FacebookConfig

    return {
      module: FacebookModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: FacebookConfig, useValue: availableConfig },
        FacebookService,
        FacebookAuthProvider,
        FacebookPublishProvider,
        FacebookAnalyticsProvider,
        FacebookEngagementProvider,
        FacebookWorkProvider,
        FacebookWebhookProvider,
        {
          provide: 'FACEBOOK_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            FacebookAuthProvider,
            FacebookPublishProvider,
            FacebookAnalyticsProvider,
            FacebookEngagementProvider,
            FacebookWorkProvider,
            FacebookWebhookProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: FacebookAuthProvider,
            publish: FacebookPublishProvider,
            analytics: FacebookAnalyticsProvider,
            engagement: FacebookEngagementProvider,
            work: FacebookWorkProvider,
            webhook: FacebookWebhookProvider,
          ) => {
            registry.register({
              platform: FACEBOOK_METADATA.platform,
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
        FacebookService,
        FacebookAuthProvider,
        FacebookPublishProvider,
        FacebookAnalyticsProvider,
        FacebookEngagementProvider,
        FacebookWorkProvider,
        FacebookWebhookProvider,
      ],
    }
  }
}
