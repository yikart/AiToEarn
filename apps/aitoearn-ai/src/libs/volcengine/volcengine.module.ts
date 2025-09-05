import { DynamicModule, Module } from '@nestjs/common'
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
        VolcengineService,
      ],
      exports: [VolcengineService],
    }
  }
}
