import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { ThreadsAnalyticsProvider } from './threads-analytics.provider'
import { ThreadsAuthProvider } from './threads-auth.provider'
import { ThreadsEngagementProvider } from './threads-engagement.provider'
import { ThreadsPublishOptionsProvider } from './threads-publish-options.provider'
import { ThreadsPublishProvider } from './threads-publish.provider'
import { ThreadsWorkProvider } from './threads-work.provider'
import { ThreadsConfig } from './threads.config'
import { THREADS_METADATA } from './threads.constants'
import { ThreadsService } from './threads.service'

@Module({})
export class ThreadsModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: ThreadsModule }
    }

    const metadata = { ...THREADS_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: ThreadsModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'THREADS_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: THREADS_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as ThreadsConfig

    return {
      module: ThreadsModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: ThreadsConfig, useValue: availableConfig },
        ThreadsService,
        ThreadsAuthProvider,
        ThreadsPublishProvider,
        ThreadsPublishOptionsProvider,
        ThreadsAnalyticsProvider,
        ThreadsEngagementProvider,
        ThreadsWorkProvider,
        {
          provide: 'THREADS_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            ThreadsAuthProvider,
            ThreadsPublishProvider,
            ThreadsPublishOptionsProvider,
            ThreadsAnalyticsProvider,
            ThreadsEngagementProvider,
            ThreadsWorkProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: ThreadsAuthProvider,
            publish: ThreadsPublishProvider,
            publishOptions: ThreadsPublishOptionsProvider,
            analytics: ThreadsAnalyticsProvider,
            engagement: ThreadsEngagementProvider,
            work: ThreadsWorkProvider,
          ) => {
            registry.register({
              platform: THREADS_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
              publish,
              publishOptions,
              analytics,
              engagement,
              work,
            })
          },
        },
      ],
      exports: [
        ThreadsService,
        ThreadsAuthProvider,
        ThreadsPublishProvider,
        ThreadsPublishOptionsProvider,
        ThreadsAnalyticsProvider,
        ThreadsEngagementProvider,
        ThreadsWorkProvider,
      ],
    }
  }
}
