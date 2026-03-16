/*
 * @Author: nevin
 * @Date: 2024-09-02 14:45:57
 * @LastEditTime: 2025-02-22 12:37:22
 * @LastEditors: nevin
 * @Description: 素材库
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType, UserType } from '@yikart/common'
import { DEFAULT_SCHEMA_OPTIONS } from '../mongodb.constants'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'materialGroup' })
export class MaterialGroup extends WithTimestampSchema {
  id: string

  @Prop({
    required: true,
    index: true,
  })
  userId: string

  @Prop({
    required: true,
    index: true,
    default: UserType.User,
  })
  userType: UserType

  @Prop({
    required: true,
    index: true,
  })
  name: string

  @Prop({
    required: false,
  })
  desc?: string

  // 是否默认
  @Prop({
    required: true,
    index: true,
    default: false,
  })
  isDefault: boolean

  // 平台限制，空数组表示不限制
  @Prop({
    required: false,
    type: [String],
    enum: AccountType,
    index: true,
    default: [],
  })
  platforms: AccountType[]

  // 是否开启推广
  @Prop({
    required: true,
    default: true,
  })
  openAffiliate: boolean
}

export const MaterialGroupSchema = SchemaFactory.createForClass(MaterialGroup)
