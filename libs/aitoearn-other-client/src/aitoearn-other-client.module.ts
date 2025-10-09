import { DynamicModule, Module } from '@nestjs/common'
import { NatsClientModule } from '@yikart/nats-client'
import { AitoearnOtherClient } from './aitoearn-other-client'
import { AitoearnOtherClientConfig } from './aitoearn-other-client.config'

@Module({})
export class AitoearnOtherClientModule {
  static forRoot(options: AitoearnOtherClientConfig): DynamicModule {
    return {
      global: true,
      module: AitoearnOtherClientModule,
      imports: [
        NatsClientModule.register({
          name: options.name,
          servers: options.servers,
          user: options.user,
          pass: options.pass,
          prefix: options.prefix,
        }),
      ],
      providers: [
        {
          provide: AitoearnOtherClientConfig,
          useValue: options,
        },
        AitoearnOtherClient,
      ],
      exports: [AitoearnOtherClient, NatsClientModule],
    }
  }
}
