import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { GrokLibModule } from '../../libs/grok'
import { GrokVideoService } from './grok.service'

@Module({
  imports: [
    GrokLibModule.forRoot(config.ai.grok),
  ],
  providers: [GrokVideoService],
  exports: [GrokVideoService],
})
export class GrokVideoModule {}
