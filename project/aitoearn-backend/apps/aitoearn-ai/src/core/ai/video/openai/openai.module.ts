import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { OpenaiModule as OpenaiLibModule } from '../../libs/openai'
import { OpenAIVideoController } from './openai.controller'
import { OpenAIVideoService } from './openai.service'

@Module({
  imports: [
    OpenaiLibModule.forRoot(config.ai.openai),
  ],
  controllers: [OpenAIVideoController],
  providers: [OpenAIVideoService],
  exports: [OpenAIVideoService],
})
export class OpenAIVideoModule {}
