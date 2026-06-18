import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { KwaiAnalyticsProvider } from './kwai-analytics.provider'
import { KwaiAuthProvider } from './kwai-auth.provider'
import { KwaiPublishProvider } from './kwai-publish.provider'
import { KwaiWorkProvider } from './kwai-work.provider'
import { KwaiConfig } from './kwai.config'
import { KWAI_METADATA } from './kwai.constants'
import { KwaiService } from './kwai.service'

@Module({})
export class KwaiModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: KwaiModule }
    }

    const metadata = { ...KWAI_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: KwaiModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'KWAI_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: KWAI_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as KwaiConfig

    return {
      module: KwaiModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: KwaiConfig, useValue: availableConfig },
        KwaiService,
        KwaiAuthProvider,
        KwaiPublishProvider,
        KwaiWorkProvider,
        KwaiAnalyticsProvider,
        {
          provide: 'KWAI_INTEGRATION',
          inject: [PlatformIntegrationRegistry, KwaiAuthProvider, KwaiPublishProvider, KwaiWorkProvider, KwaiAnalyticsProvider],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: KwaiAuthProvider,
            publish: KwaiPublishProvider,
            work: KwaiWorkProvider,
            analytics: KwaiAnalyticsProvider,
          ) => {
            registry.register({
              platform: KWAI_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              work,
              analytics,
            })
          },
        },
      ],
      exports: [
        KwaiService,
        KwaiAuthProvider,
        KwaiPublishProvider,
        KwaiWorkProvider,
        KwaiAnalyticsProvider,
      ],
    }
  }
}
