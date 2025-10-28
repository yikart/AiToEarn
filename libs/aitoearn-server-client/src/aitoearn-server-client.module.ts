import { DynamicModule, Module } from '@nestjs/common'
import { AitoearnServerClientConfig } from './aitoearn-server-client.config'
import { AitoearnServerClientService } from './aitoearn-server-client.service'

@Module({})
export class AitoearnServerClientModule {
  static register(options: AitoearnServerClientConfig): DynamicModule {
    return {
      module: AitoearnServerClientModule,
      imports: [
      ],
      providers: [
        {
          provide: AitoearnServerClientConfig,
          useValue: options,
        },
        AitoearnServerClientService,
      ],
      exports: [AitoearnServerClientService],
    }
  }
}
