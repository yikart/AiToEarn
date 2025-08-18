import { DynamicModule, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { NatsClient } from './nats.client'
import { NatsConfig } from './nats.config'

@Module({})
export class NatsClientModule {
  static register(options: NatsConfig): DynamicModule {
    return {
      module: NatsClientModule,
      imports: [
        ClientsModule.register([
          {
            name: 'NATS_CLIENT',
            transport: Transport.NATS,
            options,
          },
        ]),
      ],
      providers: [
        {
          provide: NatsConfig,
          useValue: options,
        },
        NatsClient,
      ],
      exports: [NatsClient, ClientsModule],
    }
  }
}
