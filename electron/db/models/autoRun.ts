/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-03-19 19:31:29
 * @LastEditors: nevin
 * @Description: 自动任务 autoRun
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';

// 状态 进行中 暂停 删除
export enum AutoRunStatus {
  DOING = 2, // 进行中
  PAUSE = 3, // 暂停
  DELETE = 4, // 删除
}

export enum AutoRunType {
  ReplyComment = 1, // 回复评论
}

@Entity({ name: 'autoRun' })
export class AutoRunModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({ type: 'int', nullable: false, comment: '账号id,对应account表id' })
  accountId!: number;

  @Column({
    type: 'text',
    nullable: false,
    comment: '对应数据的数据内容 JSON字符串',
  })
  data!: string;

  @Column({ type: 'int', nullable: false, comment: '执行次数', default: 0 })
  runCount!: number;

  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '自动程序状态',
    default: AutoRunStatus.DOING,
  })
  status!: AutoRunStatus;

  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '类型',
  })
  type!: AutoRunType;

  @Column({
    type: 'varchar',
    nullable: false,
    comment:
      '周期类型 天 day-22 (例:每天22时) 周 week-2 (例:每周周二,周日0) 月 month-22 (例:每月22号)',
  })
  cycleType!: string;
}
