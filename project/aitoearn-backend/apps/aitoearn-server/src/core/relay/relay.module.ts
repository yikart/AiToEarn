import { Global, Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { config } from '../../config'
import { ChannelSharedModule } from '../channel/platforms/channel-shared.module'
import { RelayClientService } from './relay-client.service'
import { RelayExceptionFilter } from './relay-exception.filter'
import { RelayOAuthController } from './relay-oauth.controller'

@Global()
@Module({
  imports: [ChannelSharedModule],
  controllers: [RelayOAuthController],
  providers: [
    RelayClientService,
    {
      provide: APP_FILTER,
      useFactory: (relayClientService: RelayClientService) =>
        new RelayExceptionFilter(config.relay, config.assets, relayClientService),
      inject: [RelayClientService],
    },
  ],
  exports: [RelayClientService],
})
export class RelayModule {}
