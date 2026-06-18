import { DynamicModule, Module } from '@nestjs/common'
import { GeminiConfig } from './gemini.config'
import { GeminiService } from './gemini.service'

@Module({})
export class GeminiModule {
  static forRoot(config: GeminiConfig): DynamicModule {
    return {
      global: true,
      module: GeminiModule,
      providers: [
        {
          provide: GeminiConfig,
          useValue: config,
        },
        GeminiService,
      ],
      exports: [GeminiService],
    }
  }
}
