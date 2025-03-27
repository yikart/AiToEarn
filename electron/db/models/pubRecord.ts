/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-05 17:00:23
 * @LastEditors: nevin
 * @Description: 发布记录
 */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TempModel } from './temp';
import { PubType } from '../../../commont/publish/PublishEnum';

export enum PubStatus {
  UNPUBLISH = 0, // 未发布/草稿
  RELEASED = 1, // 已发布
  FAIL = 2, // 发布失败
  PartSuccess = 3, // 部分成功
}
@Entity({ name: 'pubRecord' })
export class PubRecordModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({
    type: 'varchar',
    enum: PubType,
    nullable: false,
    comment: '发布类型',
  })
  type!: PubType;

  // 标题 视频发布没有标题
  @Column({ type: 'varchar', nullable: false, comment: '标题' })
  title?: string;

  // 简介
  @Column({ type: 'varchar', nullable: false, comment: '简介' })
  desc!: string;

  // 视频路径
  @Column({ type: 'varchar', nullable: true, comment: '视频路径' })
  videoPath?: string;

  // 定时发布日期
  @Column({ type: 'datetime', nullable: true, comment: '定时发布日期' })
  timingTime?: Date;

  // 封面路径
  @Column({
    type: 'varchar',
    nullable: false,
    comment: '封面路径，展示给前台用',
  })
  coverPath!: string;

  // 通用封面路径
  @Column({ type: 'varchar', nullable: true, comment: '通用封面路径' })
  commonCoverPath?: string;

  // 发布时间
  @Column({ type: 'datetime', nullable: false, comment: '发布时间' })
  publishTime!: Date;

  // 状态
  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '状态 0=未发布/草稿 1=已发布',
    enum: PubStatus,
    default: PubStatus.UNPUBLISH,
  })
  status!: PubStatus;
}
