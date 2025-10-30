import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { WorkData } from './workData.schema';

@Schema({
  collection: 'video',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Video extends WorkData {
  @Prop({
    required: true,
  })
  videoPath: string; // 视频路径
}

export const VideoSchema = SchemaFactory.createForClass(Video);
