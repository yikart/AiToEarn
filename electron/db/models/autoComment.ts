/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-17 12:24:49
 * @LastEditors: nevin
 * @Description: 自动评论 autoComment
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';

// 状态 未进行 进行中 失败 已完成
export enum AutoCommentStatus {
  UNDO = 0,
  DOING = 1,
  FAIL = 2,
  DONE = 3,
}

@Entity({ name: 'autoComment' })
export class AccountModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({ type: 'varchar', nullable: false, comment: '名称' })
  title!: string;

  @Column({ type: 'int', nullable: false, comment: '总点赞数量', default: 0 })
  likeCount!: number;

  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '登录状态，用于判断是否失效',
    default: AccountStatus.USABLE,
  })
  status?: AccountStatus;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: '其他token 目前抖音用',
    default: '',
  })
  token?: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '登录时间',
  })
  loginTime?: Date;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  uid!: string;

  // 账号
  @Column({ type: 'varchar', nullable: false, comment: '账号' })
  account!: string;

  // 头像
  @Column({ type: 'varchar', nullable: false, comment: '头像' })
  avatar!: string;

  // 昵称
  @Column({ type: 'varchar', nullable: false, comment: '昵称' })
  nickname!: string;

  // 粉丝数量
  @Column({ type: 'int', nullable: false, comment: '粉丝数量', default: 0 })
  fansCount!: number;

  // 阅读数量
  @Column({ type: 'int', nullable: false, comment: '总阅读数量', default: 0 })
  readCount!: number;

  // 收藏数量
  @Column({ type: 'int', nullable: false, comment: '总收藏数量', default: 0 })
  collectCount!: number;

  // 转发数量
  @Column({ type: 'int', nullable: false, comment: '总转发数量', default: 0 })
  forwardCount!: number;

  // 评论数量
  @Column({ type: 'int', nullable: false, comment: '总评论数量', default: 0 })
  commentCount!: number;

  @Column({ type: 'datetime', nullable: true, comment: '最后统计时间' })
  lastStatsTime?: Date;

  // 作品数量
  @Column({ type: 'int', nullable: false, comment: '作品数量', default: 0 })
  workCount?: number;

  // 收益
  @Column({ type: 'bigint', nullable: false, comment: '收益', default: 0 })
  income?: number;
}
