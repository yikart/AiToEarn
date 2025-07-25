import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { config } from '@/config'
import { AccountNatsApi } from './account/account.natsApi'
import { ChannelNatsApi } from './channel/channel.natsApi'
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
              name: 'aitoearn-plat-clent',
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
    AccountNatsApi,
    ChannelNatsApi,
  ],
  exports: [
    NatsService,
    AccountNatsApi,
    ChannelNatsApi,
  ],
})
export class NatsModule {}
