import { Module } from '@nestjs/common'
import { MaterialGroupController } from './material-group.controller'
import { MaterialGroupService } from './material-group.service'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'
import { MediaGroupController } from './media-group.controller'
import { MediaGroupService } from './media-group.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
  controllers: [MediaController, MediaGroupController, MaterialGroupController, MaterialController],
  providers: [MediaService, MediaGroupService, MaterialGroupService, MaterialService],
  exports: [MediaService, MediaGroupService, MaterialGroupService, MaterialService],
})
export class ContentModule { }
