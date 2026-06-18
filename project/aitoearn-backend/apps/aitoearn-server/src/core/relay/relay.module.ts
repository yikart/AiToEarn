import { Global, Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { config } from '../../config'
import { ChannelsModule } from '../channels/channels.module'
import { RelayClientService } from './relay-client.service'
import { RelayExceptionFilter } from './relay-exception.filter'
import { RelayOAuthController } from './relay-oauth.controller'

@Global()
@Module({
  imports: [ChannelsModule],
  controllers: [RelayOAuthController],
  providers: [
    {
      provide: APP_FILTER,
      useFactory: (relayClientService: RelayClientService) =>
        new RelayExceptionFilter(config.relay, config.assets, relayClientService),
      inject: [RelayClientService],
    },
  ],
})
export class RelayModule {}
