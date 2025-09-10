import { DynamicModule, Module } from '@nestjs/common'
import { NatsClientModule } from '@yikart/nats-client'
import { AitoearnAiClient } from './aitoearn-ai-client'
import { AitoearnAiClientConfig } from './aitoearn-ai-client.config'

@Module({})
export class AitoearnAiClientModule {
  static forRoot(options: AitoearnAiClientConfig): DynamicModule {
    return {
      global: true,
      module: AitoearnAiClientModule,
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
          provide: AitoearnAiClientConfig,
          useValue: options,
        },
        AitoearnAiClient,
      ],
      exports: [AitoearnAiClient, NatsClientModule],
    }
  }
}
