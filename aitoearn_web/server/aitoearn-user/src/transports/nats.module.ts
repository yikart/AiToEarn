import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { config } from '@/config'
import { NatsService } from './nats.service'

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AITOEARN_SERVICE',
        useFactory: () => {
          return {
            transport: Transport.NATS,
            options: {
              name: config.nats.name,
              servers: config.nats.servers,
              user: config.nats.user,
              pass: config.nats.pass,
            },
          }
        },
      },
    ]),
  ],
  providers: [
    NatsService,
  ],
  exports: [
    NatsService,
  ],
})
export class NatsModule {}
