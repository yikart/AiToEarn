/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:07
 * @LastEditTime: 2024-09-05 15:18:26
 * @LastEditors: nevin
 * @Description: 发布模块
 */
import { Module } from '@nestjs/common';
import { PublishService } from './publish.service';
import { PublishController } from './publish.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PubRecord, PubRecordSchema } from 'src/db/schema/pubRecord.schema';
import { VideoService } from './video/video.service';
import { VideoController } from './video/video.controller';
import { Video, VideoSchema } from 'src/db/schema/video.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PubRecord.name, schema: PubRecordSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
  ],
  providers: [PublishService, VideoService],
  controllers: [PublishController, VideoController],
})
export class PublishModule {}
