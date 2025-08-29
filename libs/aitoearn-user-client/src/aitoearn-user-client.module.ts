import { DynamicModule, Module } from '@nestjs/common'
import { NatsClientModule } from '@yikart/nats-client'
import { AitoearnUserClientConfig } from './aitoearn-user-client.config'
import { AitoearnUserClient } from './aitoearn-user.client'

@Module({})
export class AitoearnUserClientModule {
  static forRoot(options: AitoearnUserClientConfig): DynamicModule {
    return {
      global: true,
      module: AitoearnUserClientModule,
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
          provide: AitoearnUserClientConfig,
          useValue: options,
        },
        AitoearnUserClient,
      ],
      exports: [AitoearnUserClient, NatsClientModule],
    }
  }
}
