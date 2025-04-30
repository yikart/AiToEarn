/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-03-23 09:27:54
 * @LastEditors: nevin
 * @Description: 互动记录记录 interactionRecord
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';
import { AccountType } from '../../../commont/AccountEnum';

@Entity({ name: 'interactionRecord' })
export class InteractionRecordModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({ type: 'int', nullable: false, comment: '账号id,对应account表id' })
  accountId!: number;

  @Column({
    type: 'varchar',
    enum: AccountType,
    nullable: true,
    comment: '平台类型',
  })
  type!: AccountType;

  @Column({ type: 'varchar', nullable: false, comment: '作品Id' })
  worksId!: string;

  @Column({ type: 'varchar', nullable: true, comment: '作品标题' })
  worksTitle?: string;

  @Column({ type: 'varchar', nullable: true, comment: '评论备注' })
  commentRemark?: string;

  @Column({ type: 'varchar', nullable: true, comment: '封面' })
  worksCover?: string;

  @Column({ type: 'varchar', nullable: false, comment: '评论内容' })
  commentContent!: string;

  @Column({ type: 'tinyint', nullable: false, comment: '是否点赞' })
  isLike!: 0 | 1;

  @Column({ type: 'tinyint', nullable: false, comment: '是否收藏' })
  isCollect!: 0 | 1;
}
