import { Module } from '@nestjs/common'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { ContentUtilService } from './util.service'

@Module({
  imports: [],
  controllers: [MaterialController, MediaController],
  providers: [MediaService, MaterialService, ContentUtilService],
})
export class ContentModule {}
