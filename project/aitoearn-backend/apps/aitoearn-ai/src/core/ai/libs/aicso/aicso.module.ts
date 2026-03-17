import { DynamicModule, Module } from '@nestjs/common'
import { AicsoConfig } from './aicso.config'
import { AicsoLibService } from './aicso.service'

@Module({})
export class AicsoLibModule {
  static forRoot(config: AicsoConfig): DynamicModule {
    return {
      global: true,
      module: AicsoLibModule,
      providers: [
        {
          provide: AicsoConfig,
          useValue: config,
        },
        AicsoLibService,
      ],
      exports: [AicsoLibService],
    }
  }
}
