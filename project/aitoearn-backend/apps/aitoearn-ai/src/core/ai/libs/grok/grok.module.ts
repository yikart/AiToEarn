import { DynamicModule, Module } from '@nestjs/common'
import { GrokConfig } from './grok.config'
import { GrokLibService } from './grok.service'

@Module({})
export class GrokLibModule {
  static forRoot(config: GrokConfig): DynamicModule {
    return {
      global: true,
      module: GrokLibModule,
      providers: [
        {
          provide: GrokConfig,
          useValue: config,
        },
        GrokLibService,
      ],
      exports: [GrokLibService],
    }
  }
}
