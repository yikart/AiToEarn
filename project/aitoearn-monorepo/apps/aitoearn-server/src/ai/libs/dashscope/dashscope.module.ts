import { DynamicModule, Module } from '@nestjs/common'
import { DashscopeConfig } from './dashscope.config'
import { DashscopeService } from './dashscope.service'

@Module({})
export class DashscopeModule {
  static forRoot(config: DashscopeConfig): DynamicModule {
    return {
      global: true,
      module: DashscopeModule,
      providers: [
        {
          provide: DashscopeConfig,
          useValue: config,
        },
        DashscopeService,
      ],
      exports: [DashscopeService],
    }
  }
}
