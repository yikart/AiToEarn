import { Module } from '@nestjs/common'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'

@Module({
  imports: [],
  controllers: [MaterialController, MediaController],
  providers: [MediaService, MaterialService],
})
export class ContentModule {}
