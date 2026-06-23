import { DynamicModule, Module } from '@nestjs/common'
import { AtlascloudConfig } from './atlascloud.config'
import { AtlascloudService } from './atlascloud.service'

@Module({})
export class AtlascloudModule {
  static forRoot(config: AtlascloudConfig): DynamicModule {
    return {
      global: true,
      module: AtlascloudModule,
      providers: [
        {
          provide: AtlascloudConfig,
          useValue: config,
        },
        AtlascloudService,
      ],
      exports: [AtlascloudService],
    }
  }
}
