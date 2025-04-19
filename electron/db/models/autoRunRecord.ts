/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-03-23 09:27:54
 * @LastEditors: nevin
 * @Description: 自动评论 autoComment
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';
import { AutoRunType } from './autoRun';

// 状态 进行中 失败 完成
export enum AutoRunRecordStatus {
  DOING = 1, // 进行中
  FAIL = 2, // 失败
  SUCCESS = 3, // 完成
}

@Entity({ name: 'autoRunRecord' })
export class AutoRunRecordModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({ type: 'int', nullable: false, comment: ' 自动任务id' })
  autoRunId!: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '自动程序运行状态',
    default: AutoRunRecordStatus.DOING,
  })
  status!: AutoRunRecordStatus;

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

  @Column({ type: 'varchar', nullable: true, comment: '记录描述' })
  record?: string;
}
