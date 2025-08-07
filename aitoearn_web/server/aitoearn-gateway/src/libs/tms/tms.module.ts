import { DynamicModule, Global, Module } from '@nestjs/common'
import { TmsConfig } from './tms.config'
import { TmsService } from './tms.service'

@Global()
@Module({})
export class TmsModule {
  static forRoot(config: TmsConfig): DynamicModule {
    return {
      global: true,
      module: TmsModule,
      providers: [
        { provide: TmsConfig, useValue: config },
        TmsService,
      ],
      exports: [TmsService],
    }
  }
}
