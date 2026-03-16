import { Module } from '@nestjs/common'
import { ModelsConfigModule } from '../../models-config'
import { AicsoGrokVideoService } from './aicso-grok.service'

@Module({
  imports: [
    ModelsConfigModule,
  ],
  providers: [AicsoGrokVideoService],
  exports: [AicsoGrokVideoService],
})
export class AicsoGrokVideoModule {}
