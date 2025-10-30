/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-01-21 14:48:45
 * @LastEditors: nevin
 * @Description: 通用模板
 */
import { Column } from 'typeorm';

export class TempModel {
  // 创建时间
  @Column({
    type: 'datetime',
    nullable: false,
    comment: '创建时间',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime?: Date;

  // 更新时间
  @Column({
    type: 'datetime',
    nullable: false,
    comment: '更新时间',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateTime?: Date;
}
