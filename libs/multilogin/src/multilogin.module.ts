import type { DynamicModule } from '@nestjs/common'
import { Module } from '@nestjs/common'

import { MultiloginConfig } from './multilogin.config'
import { MultiloginService } from './multilogin.service'

@Module({})
export class MultiloginModule {
  static forRoot(config: MultiloginConfig): DynamicModule {
    return {
      module: MultiloginModule,
      providers: [
        {
          provide: MultiloginConfig,
          useValue: config,
        },
        {
          provide: MultiloginService,
          useFactory: (multiloginConfig: MultiloginConfig) => {
            return new MultiloginService(multiloginConfig)
          },
          inject: [MultiloginConfig],
        },
      ],
      exports: [MultiloginService],
      global: true,
    }
  }
}
