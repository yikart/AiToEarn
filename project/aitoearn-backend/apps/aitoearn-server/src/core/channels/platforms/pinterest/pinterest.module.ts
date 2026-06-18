import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { PinterestAnalyticsProvider } from './pinterest-analytics.provider'
import { PinterestAuthProvider } from './pinterest-auth.provider'
import { PinterestPublishOptionsProvider } from './pinterest-publish-options.provider'
import { PinterestPublishProvider } from './pinterest-publish.provider'
import { PinterestWorkProvider } from './pinterest-work.provider'
import { PinterestConfig } from './pinterest.config'
import { PINTEREST_METADATA } from './pinterest.constants'
import { PinterestService } from './pinterest.service'

@Module({})
export class PinterestModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: PinterestModule }
    }

    const metadata = { ...PINTEREST_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: PinterestModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'PINTEREST_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: PINTEREST_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as PinterestConfig

    return {
      module: PinterestModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: PinterestConfig, useValue: availableConfig },
        PinterestService,
        PinterestAuthProvider,
        PinterestPublishProvider,
        PinterestPublishOptionsProvider,
        PinterestAnalyticsProvider,
        PinterestWorkProvider,
        {
          provide: 'PINTEREST_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            PinterestAuthProvider,
            PinterestPublishProvider,
            PinterestPublishOptionsProvider,
            PinterestAnalyticsProvider,
            PinterestWorkProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: PinterestAuthProvider,
            publish: PinterestPublishProvider,
            publishOptions: PinterestPublishOptionsProvider,
            analytics: PinterestAnalyticsProvider,
            work: PinterestWorkProvider,
          ) => {
            registry.register({
              platform: PINTEREST_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              publishOptions,
              analytics,
              work,
            })
          },
        },
      ],
      exports: [
        PinterestService,
        PinterestAuthProvider,
        PinterestPublishProvider,
        PinterestPublishOptionsProvider,
        PinterestAnalyticsProvider,
        PinterestWorkProvider,
      ],
    }
  }
}
