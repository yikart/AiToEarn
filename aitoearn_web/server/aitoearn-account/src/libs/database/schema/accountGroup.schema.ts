import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { BaseTemp } from './time.tamp'

@Schema({
  collection: 'accountGroup',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class AccountGroup extends BaseTemp {
  id: string

  @Prop({
    required: true,
    type: String,
  })
  userId: string

  // 是否为默认用户组
  @Prop({
    required: true,
    type: Boolean,
    default: false,
  })
  isDefault: boolean

  @Prop({
    required: false,
    type: String,
  })
  ip?: string

  @Prop({
    required: false,
    type: String,
  })
  location?: string

  // 代理IP
  @Prop({
    required: false,
    type: String,
    default: '',
  })
  proxyIp: string

  // 组名称
  @Prop({
    required: true,
    type: String,
  })
  name: string

  // json 指纹浏览器配置
  @Prop({
    required: false,
    type: Object,
  })
  browserConfig?: Record<string, any>

  // 组排序
  @Prop({
    required: true,
    type: Number,
    default: 1,
  })
  rank: number
}

export const AccountGroupSchema = SchemaFactory.createForClass(AccountGroup)
