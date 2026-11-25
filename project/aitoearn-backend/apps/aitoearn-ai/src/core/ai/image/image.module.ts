import { Module } from '@nestjs/common'
import { config } from '../../../config'
import { ModelsConfigModule } from '../models-config'
import { ImageConsumer } from './image.consumer'
import { ImageController } from './image.controller'
import { ImageService } from './image.service'
import { MiniMaxImageConfig } from './minimax-image.config'

@Module({
  imports: [
    ModelsConfigModule,
  ],
  controllers: [ImageController],
  providers: [
    { provide: MiniMaxImageConfig, useValue: config.ai.minimaxImage ?? null },
    ImageService,
    ImageConsumer,
  ],
  exports: [ImageService],
})
export class ImageModule {}
