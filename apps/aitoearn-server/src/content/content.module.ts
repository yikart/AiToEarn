import { Global, Module } from '@nestjs/common'
import { S3Module } from '@yikart/aws-s3'
import { config } from '../config'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { MediaGroupController } from './mediaGroup.controller'
import { MediaGroupService } from './mediaGroup.service'

@Global()
@Module({
  imports: [
    S3Module.forRoot(config.awsS3),
  ],
  controllers: [MediaController, MediaGroupController],
  providers: [MediaService, MediaGroupService],
})
export class ContentModule { }
