import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { GeminiModule as GeminiLibModule } from '../../libs/gemini'
import { ModelsConfigModule } from '../../models-config'
import { SettlementModule } from '../../settlement'
import { GeminiVideoService } from './gemini.service'

@Module({
  imports: [
    GeminiLibModule.forRoot(config.ai.gemini),
    ModelsConfigModule,
    SettlementModule,
  ],
  providers: [GeminiVideoService],
  exports: [GeminiVideoService],
})
export class GeminiVideoModule {}
