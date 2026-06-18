import { DynamicModule, Module } from '@nestjs/common'
import { RelayLibModule } from '../../libs/relay'
import { RelayConfig } from '../../libs/relay/relay.config'
import { ModelsConfigModule } from '../../models-config'
import { RelayVideoService } from './relay-video.service'

@Module({})
export class RelayVideoModule {
  static forRoot(config?: RelayConfig): DynamicModule {
    if (!config) {
      return { module: RelayVideoModule }
    }

    return {
      module: RelayVideoModule,
      imports: [
        RelayLibModule.forRoot(config),
        ModelsConfigModule,
      ],
      providers: [RelayVideoService],
      exports: [RelayVideoService],
    }
  }
}
