import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { S3Module } from '@yikart/aws-s3'
import { AiModule } from '../ai/ai.module'
import { config } from '../config'
import { MaterialController } from './material.controller'
import { MaterialInternalController } from './material.internal.controller'
import { MaterialService } from './material.service'
import { MaterialGroupController } from './materialGroup.controller'
import { MaterialGroupService } from './materialGroup.service'
import { MaterialTaskService } from './materialTask.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { MediaGroupController } from './mediaGroup.controller'
import { MediaGroupService } from './mediaGroup.service'

@Global()
@Module({
  imports: [
    S3Module.forRoot(config.awsS3),
    AiModule,
    BullModule.registerQueue({
      name: 'bull_material_generate', // 队列名称-任务自动审核
      defaultJobOptions: {
        delay: 20000, // 20 seconds
        removeOnComplete: true,
      },
    }),
  ],
  controllers: [MediaController, MediaGroupController, MaterialGroupController, MaterialController, MaterialInternalController],
  providers: [MediaService, MediaGroupService, MaterialGroupService, MaterialService, MaterialTaskService],
  exports: [MediaService, MediaGroupService, MaterialGroupService, MaterialService],
})
export class ContentModule { }
