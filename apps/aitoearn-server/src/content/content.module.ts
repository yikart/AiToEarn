import { Global, Module } from '@nestjs/common'
import { S3Module } from '@yikart/aws-s3'
import { config } from '../config'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'
import { MaterialGroupController } from './materialGroup.controller'
import { MaterialGroupService } from './materialGroup.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { MediaGroupController } from './mediaGroup.controller'
import { MediaGroupService } from './mediaGroup.service'

@Global()
@Module({
  imports: [
    S3Module.forRoot(config.awsS3),
  ],
  controllers: [MediaController, MediaGroupController, MaterialGroupController, MaterialController],
  providers: [MediaService, MediaGroupService, MaterialGroupService, MaterialService],
})
export class ContentModule { }
