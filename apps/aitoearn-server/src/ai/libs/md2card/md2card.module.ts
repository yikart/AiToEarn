import { DynamicModule, Module } from '@nestjs/common'
import { Md2cardConfig } from './md2card.config'
import { Md2cardService } from './md2card.service'

@Module({})
export class Md2cardModule {
  static forRoot(config: Md2cardConfig): DynamicModule {
    return {
      module: Md2cardModule,
      providers: [
        {
          provide: Md2cardConfig,
          useValue: config,
        },
        Md2cardService,
      ],
      exports: [Md2cardService],
    }
  }
}
