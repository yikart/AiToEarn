// 账户组默认ID
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { TimeTemp } from './time.tamp';

// 默认用户组类型
export enum AccountGroupDefaultType {
  Default = 0,
  NonDefault = 1,
}

@Schema({
  collection: 'accountGroup',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false,
})
export class AccountGroup extends TimeTemp {
  @Prop({
    unique: true,
    index: true,
    type: Number,
    required: true,
  })
  id: number;

  @Prop({
    required: true,
    type: String,
  })
  userId: string;

  // 是否为默认用户组
  @Prop({
    required: true,
    type: Number,
    default: AccountGroupDefaultType.NonDefault,
  })
  isDefault: number;

  // 组名称
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  // 组排序
  @Prop({
    required: true,
    type: Number,
    default: 1,
  })
  rank: number;
}

export const AccountGroupSchema = SchemaFactory.createForClass(AccountGroup);
