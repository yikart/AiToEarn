import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AppPlatform } from '../enums'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class AppReleaseLinks {
  @Prop({ required: false, comment: '商店链接' })
  store?: string

  @Prop({ required: true, comment: '直接下载链接' })
  direct: string
}

@Schema({
  collection: 'app_releases',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class AppRelease extends WithTimestampSchema {
  id: string

  @Prop({ required: true, comment: '平台' })
  platform: AppPlatform

  @Prop({ required: true, comment: '版本号' })
  version: string

  @Prop({ required: true, comment: '构建号' })
  buildNumber: number

  @Prop({ required: true, comment: '强制更新' })
  forceUpdate: boolean

  @Prop({ required: true, comment: '版本说明' })
  notes: string

  @Prop({ required: true, comment: '版本链接', type: AppReleaseLinks })
  links: AppReleaseLinks

  @Prop({ required: true, comment: '发布时间' })
  publishedAt: Date
}

export const AppReleaseSchema = SchemaFactory.createForClass(AppRelease)
AppReleaseSchema.index({ platform: -1, buildNumber: -1 }, { unique: true })
