import { Module } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { ChatModule } from '../ai/chat'
import { ModelsConfigModule } from '../ai/models-config'
import { AiController } from './ai.controller'

@Module({
  imports: [
    AiModule,
    ChatModule,
    ModelsConfigModule,
  ],
  providers: [],
  controllers: [
    AiController,
  ],
})
export class InternalModule {}
