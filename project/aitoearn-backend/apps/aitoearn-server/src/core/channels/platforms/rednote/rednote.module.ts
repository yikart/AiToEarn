import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { RedNoteOfflineQrController } from './offline-qr/rednote-offline-qr.controller'
import { RedNoteOfflineQrService } from './offline-qr/rednote-offline-qr.service'
import { RedNotePublishProvider } from './rednote-publish.provider'
import { RedNoteWorkProvider } from './rednote-work.provider'
import { RednoteConfig } from './rednote.config'
import { REDNOTE_METADATA } from './rednote.constants'

@Module({})
export class RedNoteModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: RedNoteModule }
    }

    const metadata = { ...REDNOTE_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: RedNoteModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'REDNOTE_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: REDNOTE_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as RednoteConfig

    return {
      module: RedNoteModule,
      imports: [PlatformRegistryModule],
      controllers: [RedNoteOfflineQrController],
      providers: [
        { provide: RednoteConfig, useValue: availableConfig },
        RedNoteOfflineQrService,
        RedNotePublishProvider,
        RedNoteWorkProvider,
        {
          provide: 'REDNOTE_INTEGRATION',
          inject: [PlatformIntegrationRegistry, RedNotePublishProvider, RedNoteWorkProvider],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            publish: RedNotePublishProvider,
            work: RedNoteWorkProvider,
          ) => {
            registry.register({
              platform: REDNOTE_METADATA.platform,
              status: availableConfig.status,
              metadata,
              runtime: {},
              publish,
              work,
            })
          },
        },
      ],
      exports: [RedNoteOfflineQrService, RedNotePublishProvider, RedNoteWorkProvider],
    }
  }
}
