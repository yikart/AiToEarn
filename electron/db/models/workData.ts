/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-12 18:31:21
 * @LastEditors: nevin
 * @Description: 视频发布记录 不是数据表实体
 */
import { Column } from 'typeorm';
import { TempModel } from './temp';
import { PubStatus } from './pubRecord';
import { AccountType } from '../../../commont/AccountEnum';

export class WorkData extends TempModel {
  // 数据唯一ID
  @Column({ type: 'varchar', nullable: true, comment: '数据唯一ID' })
  dataId?: string;

  @Column({
    type: 'varchar',
    enum: AccountType,
    nullable: false,
    comment: '平台类型',
  })
  type!: AccountType;

  // 发布时间
  @Column({ type: 'datetime', nullable: true, comment: '发布时间' })
  publishTime?: Date;

  // 其他信息
  @Column({ type: 'json', nullable: true, comment: '其他信息' })
  otherInfo?: Record<string, any>;

  // 失败原因
  @Column({
    type: 'varchar',
    nullable: true,
    comment: '发布失败原因（如果失败）',
  })
  failMsg?: string;

  // 状态
  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '状态 0 未发布/草稿 1 已发布 2=发布失败',
    enum: PubStatus,
    default: PubStatus.UNPUBLISH,
  })
  status!: PubStatus;

  // 阅读数量
  @Column({ type: 'int', nullable: false, comment: '阅读数量', default: 0 })
  readCount?: number;

  //  点赞数量
  @Column({ type: 'int', nullable: false, comment: '点赞数量', default: 0 })
  likeCount?: number;

  //  收藏数量
  @Column({ type: 'int', nullable: false, comment: '收藏数量', default: 0 })
  collectCount?: number;

  //  转发数量
  @Column({ type: 'int', nullable: false, comment: '转发数量', default: 0 })
  forwardCount?: number;

  //   评论数量
  @Column({ type: 'int', nullable: false, comment: '评论数量', default: 0 })
  commentCount?: number;

  // 收益(分)
  @Column({ type: 'bigint', nullable: false, comment: '收益', default: 0 })
  income?: number;
}
