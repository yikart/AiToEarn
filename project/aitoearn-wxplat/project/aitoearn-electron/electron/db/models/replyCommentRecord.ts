/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-03-23 09:27:54
 * @LastEditors: nevin
 * @Description: 回复评论的记录 replyCommentRecord
 */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';
import { PlatType } from '../../../commont/AccountEnum';

@Entity({ name: 'replyCommentRecord' })
export class ReplyCommentRecordModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id!: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({ type: 'int', nullable: false, comment: '账号id,对应account表id' })
  accountId!: number;

  @Column({
    type: 'varchar',
    enum: PlatType,
    nullable: true,
    comment: '平台类型',
  })
  type!: PlatType;

  @Column({ type: 'varchar', nullable: false, comment: '评论Id' })
  commentId!: string;

  @Column({ type: 'varchar', nullable: false, comment: '评论内容' })
  commentContent!: string;

  @Column({ type: 'varchar', nullable: false, comment: '回复的内容' })
  replyContent!: string;
}
