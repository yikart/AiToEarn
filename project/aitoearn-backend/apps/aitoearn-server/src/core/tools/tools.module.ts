import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import {
  QrCodeArtImage,
  QrCodeArtImageRepository,
  QrCodeArtImageSchema,
} from '@yikart/mongodb'

import { ToolsController } from './tools.controller'
import { ToolsService } from './tools.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QrCodeArtImage.name, schema: QrCodeArtImageSchema },
    ]),
  ],
  controllers: [ToolsController],
  providers: [ToolsService, QrCodeArtImageRepository],
  exports: [ToolsService],
})
export class ToolsModule {}
