import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { AicsoLibModule } from '../../libs/aicso'
import { ModelsConfigModule } from '../../models-config'
import { AicsoVeoVideoService } from './aicso-veo.service'

@Module({
  imports: [
    AicsoLibModule.forRoot(config.ai.aicso),
    ModelsConfigModule,
  ],
  providers: [AicsoVeoVideoService],
  exports: [AicsoVeoVideoService],
})
export class AicsoVeoVideoModule {}
