import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { config } from '../../../config'
import { FireflycardModule } from '../../libs/fireflycard'
import { Md2cardModule } from '../../libs/md2card'
import { ModelsConfigModule } from '../models-config'
import { ImageService } from './image.service'
import { ImageWorker } from './image.worker'

@Module({
  imports: [
    FireflycardModule.forRoot(config.ai.fireflycard),
    Md2cardModule.forRoot(config.ai.md2card),
    ModelsConfigModule,
    BullModule.registerQueue({
      name: 'ai_image_async',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),
  ],
  controllers: [],
  providers: [ImageService, ImageWorker],
  exports: [ImageService],
})
export class ImageModule {}
