import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { VolcengineModule as VolcengineLibModule } from '../../libs/volcengine'
import { ModelsConfigModule } from '../../models-config'
import { VolcengineVideoController } from './volcengine.controller'
import { VolcengineVideoService } from './volcengine.service'

@Module({
  imports: [
    VolcengineLibModule.forRoot(config.ai.volcengine),
    ModelsConfigModule,
  ],
  controllers: [VolcengineVideoController],
  providers: [VolcengineVideoService],
  exports: [VolcengineVideoService],
})
export class VolcengineVideoModule {}
