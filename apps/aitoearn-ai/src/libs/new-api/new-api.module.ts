import { DynamicModule, Module } from '@nestjs/common'
import { NewApiConfig } from './new-api.config'
import { NewApiService } from './new-api.service'
import { VideoConfig, VideoService } from './video'

@Module({})
export class NewApiModule {
  static forRoot(config: NewApiConfig): DynamicModule {
    // 创建VideoConfig，使用NewApiConfig的baseURL和timeout
    const videoConfig = Object.assign(new VideoConfig(), {
      baseURL: config.baseURL,
      timeout: config.timeout,
    })

    return {
      global: true,
      module: NewApiModule,
      providers: [
        {
          provide: NewApiConfig,
          useValue: config,
        },
        {
          provide: VideoConfig,
          useValue: videoConfig,
        },
        NewApiService,
        VideoService,
      ],
      exports: [NewApiService, VideoService],
    }
  }
}
