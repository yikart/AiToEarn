import { DynamicModule, Module } from '@nestjs/common'
import { Sora2Config } from './sora2.config'
import { Sora2Service } from './sora2.service'

@Module({})
export class Sora2Module {
  static forRoot(config: Sora2Config): DynamicModule {
    return {
      global: true,
      module: Sora2Module,
      providers: [
        {
          provide: Sora2Config,
          useValue: config,
        },
        Sora2Service,
      ],
      exports: [Sora2Service],
    }
  }
}
