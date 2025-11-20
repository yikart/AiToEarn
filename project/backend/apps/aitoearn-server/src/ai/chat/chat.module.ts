import { Module } from '@nestjs/common'
import { ModelsConfigModule } from '../models-config'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'

@Module({
  imports: [
    ModelsConfigModule,
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
