import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { LinkedInAuthProvider } from './linkedin-auth.provider'
import { LinkedInPublishProvider } from './linkedin-publish.provider'
import { LinkedInWebhookProvider } from './linkedin-webhook.provider'
import { LinkedinConfig } from './linkedin.config'
import { LINKEDIN_METADATA } from './linkedin.constants'
import { LinkedInService } from './linkedin.service'

@Module({})
export class LinkedinModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: LinkedinModule }
    }

    const metadata = { ...LINKEDIN_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: LinkedinModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'LINKEDIN_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: LINKEDIN_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as LinkedinConfig

    return {
      module: LinkedinModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: LinkedinConfig, useValue: availableConfig },
        LinkedInService,
        LinkedInAuthProvider,
        LinkedInPublishProvider,
        LinkedInWebhookProvider,
        {
          provide: 'LINKEDIN_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            LinkedInAuthProvider,
            LinkedInPublishProvider,
            LinkedInWebhookProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: LinkedInAuthProvider,
            publish: LinkedInPublishProvider,
            webhook: LinkedInWebhookProvider,
          ) => {
            registry.register({
              platform: LINKEDIN_METADATA.platform,
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
        LinkedInService,
        LinkedInAuthProvider,
        LinkedInPublishProvider,
        LinkedInWebhookProvider,
      ],
    }
  }
}
