import { DynamicModule, Module } from '@nestjs/common'
import { KlingConfig } from './kling.config'
import { KlingService } from './kling.service'

@Module({})
export class KlingModule {
  static forRoot(config: KlingConfig): DynamicModule {
    return {
      global: true,
      module: KlingModule,
      providers: [
        {
          provide: KlingConfig,
          useValue: config,
        },
        KlingService,
      ],
      exports: [KlingService],
    }
  }
}
