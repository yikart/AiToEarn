import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { WithTimestampSchema } from './timestamp.schema'

export enum ManagerStatus {
  STOP = 0, // 停用
  OPEN = 1, // 正常
  DELETE = 2, // 删除
}

@Schema({
  collection: 'manager',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class Manager extends WithTimestampSchema {
  id: string

  @Prop({ required: true, unique: true })
  account: string

  @Prop({ required: true })
  password: string

  @Prop({ required: true })
  salt: string

  @Prop({ required: true })
  name: string

  @Prop({ default: ManagerStatus.OPEN })
  status: ManagerStatus

  @Prop()
  avatar?: string

  @Prop()
  mail?: string
}

export const ManagerSchema = SchemaFactory.createForClass(Manager)
