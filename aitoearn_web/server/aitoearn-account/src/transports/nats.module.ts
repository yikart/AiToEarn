import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { config } from '@/config'
import { NatsService } from './nats.service'
import { AccountPortraitNatsApi } from './task/accountPortrait.natsApi'
import { UserPortraitNatsApi } from './task/userPortrait.natsApi'

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
              name: 'aitoearn-account-clent',
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
    UserPortraitNatsApi,
    AccountPortraitNatsApi,
  ],
  exports: [
    NatsService,
    UserPortraitNatsApi,
    AccountPortraitNatsApi,
  ],
})
export class NatsModule {}
