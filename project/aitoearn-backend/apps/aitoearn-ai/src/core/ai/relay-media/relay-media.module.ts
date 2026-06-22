import type { AssetsConfig } from '@yikart/assets'
import { DynamicModule, Global, Module } from '@nestjs/common'
import { RelayConfig } from '../libs/relay'
import { RelayMediaResolverService } from './relay-media-resolver.service'
import { RELAY_MEDIA_ASSETS_CONFIG, RELAY_MEDIA_CONFIG } from './relay-media.tokens'

export { RELAY_MEDIA_ASSETS_CONFIG, RELAY_MEDIA_CONFIG } from './relay-media.tokens'

@Global()
@Module({})
export class RelayMediaModule {
  static forRoot(config?: RelayConfig, assetsConfig?: AssetsConfig): DynamicModule {
    return {
      global: true,
      module: RelayMediaModule,
      providers: [
        {
          provide: RELAY_MEDIA_CONFIG,
          useValue: config,
        },
        {
          provide: RELAY_MEDIA_ASSETS_CONFIG,
          useValue: assetsConfig,
        },
        RelayMediaResolverService,
      ],
      exports: [RelayMediaResolverService],
    }
  }
}
