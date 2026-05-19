import { Module } from '@nestjs/common'
import { ModelsConfigModule } from '../models-config'
import { SettlementModule } from '../settlement'
import { ImageConsumer } from './image.consumer'
import { ImageController } from './image.controller'
import { ImageService } from './image.service'

@Module({
  imports: [
    ModelsConfigModule,
    SettlementModule,
  ],
  controllers: [ImageController],
  providers: [ImageService, ImageConsumer],
  exports: [ImageService],
})
export class ImageModule {}
