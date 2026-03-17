import { DynamicModule, Module } from '@nestjs/common'
import { OpenaiConfig } from './openai.config'
import { OpenaiService } from './openai.service'

@Module({})
export class OpenaiModule {
  static forRoot(config: OpenaiConfig): DynamicModule {
    return {
      global: true,
      module: OpenaiModule,
      providers: [
        {
          provide: OpenaiConfig,
          useValue: config,
        },
        OpenaiService,
      ],
      exports: [OpenaiService],
    }
  }
}
