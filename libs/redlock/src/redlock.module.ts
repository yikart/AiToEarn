import { DynamicModule, Module } from '@nestjs/common'
import { RedisModule } from '@yikart/redis'
import { RedlockConfig } from './redlock.config'
import { RedlockInjector } from './redlock.injector'
import { RedlockService } from './redlock.service'

@Module({})
export class RedlockModule {
  static forRoot(config: RedlockConfig): DynamicModule {
    return {
      module: RedlockModule,
      imports: [
        RedisModule.forRoot(config.redis),
      ],
      providers: [
        {
          provide: RedlockConfig,
          useValue: config,
        },
        RedlockService,
        RedlockInjector,
      ],
      exports: [RedlockService],
      global: true,
    }
  }
}
