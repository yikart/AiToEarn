import { DynamicModule, Module } from '@nestjs/common'
import { RelayConfig } from './relay.config'
import { RelayLibService } from './relay.service'

@Module({})
export class RelayLibModule {
  static forRoot(config?: RelayConfig): DynamicModule {
    if (!config) {
      return { module: RelayLibModule }
    }

    return {
      global: true,
      module: RelayLibModule,
      providers: [
        {
          provide: RelayConfig,
          useValue: config,
        },
        RelayLibService,
      ],
      exports: [RelayLibService],
    }
  }
}
