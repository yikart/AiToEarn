import { DynamicModule, Module } from '@nestjs/common'
import { AiService } from './ai.service'

@Module({})
export class AiModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: AiModule,
      imports: [
      ],
      providers: [
        AiService,
      ],
      exports: [AiService],
    }
  }
}
