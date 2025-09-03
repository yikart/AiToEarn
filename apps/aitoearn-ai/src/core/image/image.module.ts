import { FireflycardModule } from '@libs/fireflycard'
import { Md2cardModule } from '@libs/md2card'
import { Module } from '@nestjs/common'
import { config } from '../../config'
import { ImageController } from './image.controller'
import { ImageService } from './image.service'

@Module({
  imports: [
    FireflycardModule.forRoot(config.ai.fireflycard),
    Md2cardModule.forRoot(config.ai.md2card),
  ],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
