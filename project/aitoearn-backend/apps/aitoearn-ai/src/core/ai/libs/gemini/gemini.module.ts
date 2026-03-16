import { DynamicModule, Module } from '@nestjs/common'
import { Redis } from 'ioredis'
import { GeminiKeyManagerService } from './gemini-key-manager.service'
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
        {
          provide: GeminiKeyManagerService,
          useFactory: (redis: Redis) => new GeminiKeyManagerService(config, redis),
          inject: [Redis],
        },
        GeminiService,
      ],
      exports: [GeminiService, GeminiKeyManagerService],
    }
  }
}
