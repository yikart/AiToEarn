import { Module } from '@nestjs/common'
import { ChannelsModule } from '../channels/channels.module'
import { OpenApiController } from './open-api.controller'

@Module({
  imports: [ChannelsModule],
  controllers: [OpenApiController],
})
export class OpenApiModule {}
