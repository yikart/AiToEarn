import type { DynamicModule } from '@nestjs/common'
import type { PlatformConfigWithStatus } from '../platforms.config'
import { Module } from '@nestjs/common'
import { ShortLinkModule } from '../../../short-link/short-link.module'
import { isAvailablePlatformConfig, isVisiblePlatformConfig } from '../platforms.config'
import { PlatformIntegrationRegistry } from '../platforms.registry'
import { PlatformRegistryModule } from '../platforms.registry.module'
import { DouyinAuthProvider } from './douyin-auth.provider'
import { DouyinMiniAppService } from './douyin-miniapp.service'
import { DouyinPublishProvider } from './douyin-publish.provider'
import { DouyinWebhookProvider } from './douyin-webhook.provider'
import { DouyinWorkProvider } from './douyin-work.provider'
import { DouyinConfig } from './douyin.config'
import { DOUYIN_METADATA } from './douyin.constants'
import { DouyinService } from './douyin.service'
import { DouyinOfflineQrController } from './offline-qr/douyin-offline-qr.controller'
import { DouyinOfflineQrService } from './offline-qr/douyin-offline-qr.service'

@Module({})
export class DouyinModule {
  static forRoot(config: PlatformConfigWithStatus | undefined): DynamicModule {
    if (!isVisiblePlatformConfig(config)) {
      return { module: DouyinModule }
    }

    const metadata = { ...DOUYIN_METADATA, logoUrl: config.logoUrl }

    if (!isAvailablePlatformConfig(config)) {
      return {
        module: DouyinModule,
        imports: [PlatformRegistryModule],
        providers: [
          {
            provide: 'DOUYIN_INTEGRATION',
            inject: [PlatformIntegrationRegistry],
            useFactory: (registry: PlatformIntegrationRegistry) => {
              registry.register({
                platform: DOUYIN_METADATA.platform,
                status: config.status,
                metadata,
                runtime: {},
              })
            },
          },
        ],
      }
    }

    const availableConfig = config as DouyinConfig
    const availableMetadata = { ...metadata, authType: availableConfig.authType }

    return {
      module: DouyinModule,
      imports: [PlatformRegistryModule, ShortLinkModule],
      controllers: [DouyinOfflineQrController],
      providers: [
        { provide: DouyinConfig, useValue: availableConfig },
        DouyinOfflineQrService,
        DouyinService,
        DouyinMiniAppService,
        DouyinAuthProvider,
        DouyinPublishProvider,
        DouyinWebhookProvider,
        DouyinWorkProvider,
        {
          provide: 'DOUYIN_INTEGRATION',
          inject: [PlatformIntegrationRegistry, DouyinAuthProvider, DouyinPublishProvider, DouyinWebhookProvider, DouyinWorkProvider],
          useFactory: (
            registry: PlatformIntegrationRegistry,
            auth: DouyinAuthProvider,
            publish: DouyinPublishProvider,
            webhook: DouyinWebhookProvider,
            work: DouyinWorkProvider,
          ) => {
            registry.register({
              platform: DOUYIN_METADATA.platform,
              status: availableConfig.status,
              metadata: availableMetadata,
              runtime: {},
              auth,
              publish,
              webhook,
              work,
            })
          },
        },
      ],
      exports: [
        DouyinService,
        DouyinMiniAppService,
        DouyinOfflineQrService,
        DouyinAuthProvider,
        DouyinPublishProvider,
        DouyinWebhookProvider,
        DouyinWorkProvider,
      ],
    }
  }
}
