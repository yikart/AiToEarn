import { Module } from '@nestjs/common'
import { ModelsConfigModule } from '../models-config'
import { ChatService } from './chat.service'

@Module({
  imports: [
    ModelsConfigModule,
  ],
  controllers: [],
  providers: [
    ChatService,
  ],
  exports: [
    ChatService,
  ],
})
export class ChatModule {}
