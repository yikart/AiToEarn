import { DynamicModule, Module } from '@nestjs/common'
import { FireflycardConfig } from './fireflycard.config'
import { FireflycardService } from './fireflycard.service'

@Module({})
export class FireflycardModule {
  static forRoot(config: FireflycardConfig): DynamicModule {
    return {
      module: FireflycardModule,
      providers: [
        {
          provide: FireflycardConfig,
          useValue: config,
        },
        FireflycardService,
      ],
      exports: [FireflycardService],
    }
  }
}
