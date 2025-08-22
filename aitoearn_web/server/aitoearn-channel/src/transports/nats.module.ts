import { Global, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { config } from '@/config'
import { AccountNatsApi } from './account/account.natsApi'
import { NatsService } from './nats.service'
import { PointsNatsApi } from './user/points.natsApi'

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
    AccountNatsApi,
    PointsNatsApi,
  ],
  exports: [
    NatsService,
    AccountNatsApi,
    PointsNatsApi,
  ],
})
export class NatsModule {}
