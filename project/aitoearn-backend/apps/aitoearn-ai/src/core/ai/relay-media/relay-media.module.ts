import { DynamicModule, Global, Module } from '@nestjs/common'
import { RelayConfig } from '../libs/relay/relay.config'
import { RelayMediaResolverService } from './relay-media-resolver.service'

@Global()
@Module({})
export class RelayMediaModule {
  static forRoot(config?: RelayConfig): DynamicModule {
    return {
      global: true,
      module: RelayMediaModule,
      providers: [
        {
          provide: RelayConfig,
          useValue: config,
        },
        RelayMediaResolverService,
      ],
      exports: [RelayMediaResolverService],
    }
  }
}
