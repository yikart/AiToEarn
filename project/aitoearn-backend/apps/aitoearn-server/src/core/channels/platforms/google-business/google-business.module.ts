import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { GoogleBusinessAuthProvider } from './google-business-auth.provider'
import { GoogleBusinessConfig } from './google-business.config'
import { GOOGLE_BUSINESS_METADATA } from './google-business.constants'
import { GoogleBusinessService } from './google-business.service'

@Module({})
export class GoogleBusinessModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: GoogleBusinessModule }
    }

    const metadata = { ...GOOGLE_BUSINESS_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: GoogleBusinessModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'GOOGLE_BUSINESS_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: GOOGLE_BUSINESS_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as GoogleBusinessConfig

    return {
      module: GoogleBusinessModule,
      imports: [PlatformRegistryModule],
      providers: [
        { provide: GoogleBusinessConfig, useValue: availableConfig },
        GoogleBusinessService,
        GoogleBusinessAuthProvider,
        {
          provide: 'GOOGLE_BUSINESS_INTEGRATION',
          inject: [
            PlatformIntegrationRegistry,
            GoogleBusinessAuthProvider,
          ],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: GoogleBusinessAuthProvider,
          ) => {
            registry.register({
              platform: GOOGLE_BUSINESS_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              auth,
            })
          },
        },
      ],
      exports: [
        GoogleBusinessService,
        GoogleBusinessAuthProvider,
      ],
    }
  }
}
