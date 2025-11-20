import { Module } from '@nestjs/common'
import { config } from '../../config'
import { FireflycardModule } from '../libs/fireflycard'
import { Md2cardModule } from '../libs/md2card'
import { ModelsConfigModule } from '../models-config'
import { ImageConsumer } from './image.consumer'
import { ImageController } from './image.controller'
import { ImageService } from './image.service'

@Module({
  imports: [
    FireflycardModule.forRoot(config.ai.fireflycard),
    Md2cardModule.forRoot(config.ai.md2card),
    ModelsConfigModule,
  ],
  controllers: [ImageController],
  providers: [ImageService, ImageConsumer],
  exports: [ImageService],
})
export class ImageModule {}
