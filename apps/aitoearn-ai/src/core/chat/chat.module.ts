import { RedisModule } from '@libs/redis'
import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [
    RedisModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
  ],
  exports: [
    ChatService,
  ],
})
export class ChatModule {}
