import { Global, Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { MediaGroupController } from './mediaGroup.controller'
import { MediaGroupService } from './mediaGroup.service'

@Global()
@Module({
  imports: [],
  controllers: [MediaController, MediaGroupController],
  providers: [MediaService, MediaGroupService],
})
export class ContentModule { }
