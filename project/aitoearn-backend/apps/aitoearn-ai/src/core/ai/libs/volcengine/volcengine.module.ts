import { DynamicModule, Module } from '@nestjs/common'
import { AideoService } from './services/aideo.service'
import { DirectEditService } from './services/direct-edit.service'
import { DramaRecapService } from './services/drama-recap.service'
import { MediaService } from './services/media.service'
import { UploadService } from './services/upload.service'
import { VCreativeService } from './services/vcreative.service'
import { VideoGenService } from './services/video-gen.service'
import { VolcengineConfig } from './volcengine.config'
import { VolcengineService } from './volcengine.service'

@Module({})
export class VolcengineModule {
  static forRoot(config: VolcengineConfig): DynamicModule {
    return {
      global: true,
      module: VolcengineModule,
      providers: [
        {
          provide: VolcengineConfig,
          useValue: config,
        },
        // 基础服务
        UploadService,
        MediaService,
        VideoGenService,
        // AI 服务
        AideoService,
        VCreativeService,
        DirectEditService,
        DramaRecapService,
        // Facade
        VolcengineService,
      ],
      exports: [
        // 导出 Facade（保持向后兼容）
        VolcengineService,
        // 导出专门服务（供新代码直接使用）
        UploadService,
        MediaService,
        VideoGenService,
        AideoService,
        VCreativeService,
        DirectEditService,
        DramaRecapService,
      ],
    }
  }
}
