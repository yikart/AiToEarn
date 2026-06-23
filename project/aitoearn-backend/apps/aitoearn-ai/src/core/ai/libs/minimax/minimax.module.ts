import { DynamicModule, Module } from '@nestjs/common'
import { MiniMaxConfig } from './minimax.config'
import { MiniMaxService } from './minimax.service'

@Module({})
export class MiniMaxModule {
  static forRoot(config: MiniMaxConfig): DynamicModule {
    return {
      global: true,
      module: MiniMaxModule,
      providers: [
        {
          provide: MiniMaxConfig,
          useValue: config,
        },
        MiniMaxService,
      ],
      exports: [MiniMaxService],
    }
  }
}
