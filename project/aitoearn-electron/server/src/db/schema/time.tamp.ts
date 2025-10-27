/*
 * @Author: nevin
 * @Date: 2024-09-02 14:45:57
 * @LastEditTime: 2025-02-22 12:37:22
 * @LastEditors: nevin
 * @Description: 时间模板
 */
import { Prop } from '@nestjs/mongoose';

export class TimeTemp {
  @Prop({ default: Date.now })
  createTime: Date;

  @Prop({ default: Date.now, set: () => new Date() })
  updateTime: Date;
}
