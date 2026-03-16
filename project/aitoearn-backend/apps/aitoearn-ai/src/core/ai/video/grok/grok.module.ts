import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { GrokLibModule } from '../../libs/grok'
import { ModelsConfigModule } from '../../models-config'
import { GrokVideoService } from './grok.service'

@Module({
  imports: [
    GrokLibModule.forRoot(config.ai.grok),
    ModelsConfigModule,
  ],
  providers: [GrokVideoService],
  exports: [GrokVideoService],
})
export class GrokVideoModule {}
