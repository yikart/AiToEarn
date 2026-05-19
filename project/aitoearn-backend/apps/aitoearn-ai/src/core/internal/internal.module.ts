import { Module } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { ChatModule } from '../ai/chat'
import { ModelsConfigModule } from '../ai/models-config'
import { DraftGenerationModule } from '../draft-generation/draft-generation.module'
import { AiController } from './ai.controller'
import { DraftGenerationInternalController } from './draft-generation.controller'

@Module({
  imports: [
    AiModule,
    ChatModule,
    ModelsConfigModule,
    DraftGenerationModule,
  ],
  providers: [],
  controllers: [
    AiController,
    DraftGenerationInternalController,
  ],
})
export class InternalModule {}
