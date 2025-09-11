import { DynamicModule, Module } from '@nestjs/common'
import Redis from 'ioredis'
import { RedlockConfig, RedlockConfigInput } from './redlock.config'
import { RedlockInjector } from './redlock.injector'
import { RedlockService } from './redlock.service'

@Module({})
export class RedlockModule {
  static forRoot(config: RedlockConfigInput): DynamicModule {
    return {
      module: RedlockModule,
      providers: [
        {
          provide: RedlockConfig,
          useValue: config,
        },
        {
          provide: Redis,
          useFactory: (config: RedlockConfig) => {
            return new Redis(config.redis)
          },
          inject: [RedlockConfig],
        },
        RedlockService,
        RedlockInjector,
      ],
      exports: [RedlockService],
      global: true,
    }
  }
}
