import { Global, Module } from '@nestjs/common'
import { S3Module } from '@yikart/aws-s3'
import { AiModule } from '../ai/ai.module'
import { config } from '../config'
import { MaterialGenerateConsumer } from './material-generate.consumer'
import { MaterialController } from './material.controller'
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
  ],
  controllers: [MediaController, MediaGroupController, MaterialGroupController, MaterialController],
  providers: [MediaService, MediaGroupService, MaterialGroupService, MaterialService, MaterialTaskService, MaterialGenerateConsumer],
  exports: [MediaService, MediaGroupService, MaterialGroupService, MaterialService, MaterialTaskService],
})
export class ContentModule { }
