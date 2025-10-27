/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 自增主键ID
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdDocument = Id & Document;
@Schema({ collection: 't_ids', versionKey: false })
export class Id {
  @Prop({ required: true })
  id_value: number;

  @Prop({ required: true })
  id_name: string;

  @Prop()
  update_time: number;
}
export const IdSchema = SchemaFactory.createForClass(Id);
