/*
 * @Author: nevin
 * @Date: 2024-09-02 14:45:57
 * @LastEditTime: 2025-02-22 12:37:22
 * @LastEditors: nevin
 * @Description: 素材库
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { UserType } from '@yikart/common'
import { MaterialType } from '../repositories/material.repository'
import { WithTimestampSchema } from './timestamp.schema'

@Schema({
  collection: 'materialGroup',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
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

  @Prop({
    required: true,
    enum: MaterialType,
    index: true,
  })
  type: MaterialType

  // 是否默认
  @Prop({
    required: true,
    index: true,
    default: false,
  })
  isDefault: boolean
}

export const MaterialGroupSchema = SchemaFactory.createForClass(MaterialGroup)
