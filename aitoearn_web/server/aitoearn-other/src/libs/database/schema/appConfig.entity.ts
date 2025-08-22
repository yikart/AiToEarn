/*
 * @Author: nevin
 * @Date: 2022-11-16 22:04:18
 * @LastEditTime: 2024-11-22 09:53:38
 * @LastEditors: nevin
 * @Description: 配置 AppConfigs appConfigs
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

@Schema({
  collection: 'appConfigs',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class AppConfigs extends BaseTemp {
  id: string

  @Prop({ required: true, comment: '应用标识' })
  appId: string

  @Prop({ comment: '配置键名' })
  key: string

  @Prop({
    comment: '配置值',
    type: Object,
  })
  value: Record<string, any>

  @Prop({
    comment: '配置描述',
    default: '',
  })
  description?: string

  @Prop({
    comment: '是否启用',
    default: true,
  })
  enabled: boolean

  @Prop({ type: Object })
  metadata?: Record<string, any>
}

export const AppConfigsSchema = SchemaFactory.createForClass(AppConfigs)
AppConfigsSchema.index({ appId: 1, key: 1 }, { unique: true })
