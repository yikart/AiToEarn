import { Module } from '@nestjs/common'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'
import { MaterialGroupController } from './materialGroup.controller'
import { MaterialGroupService } from './materialGroup.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { ContentUtilService } from './util.service'

@Module({
  imports: [],
  controllers: [MaterialController, MediaController, MaterialGroupController],
  providers: [MediaService, MaterialService, ContentUtilService, MaterialGroupService],
})
export class ContentModule {}
