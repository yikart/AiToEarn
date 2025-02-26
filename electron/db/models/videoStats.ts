import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TempModel } from './temp';
import { AccountType } from '../../../commont/AccountEnum';

@Entity({ name: 'video_stats' })
export class VideoStatsModel extends TempModel {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id?: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({ type: 'int', nullable: false, comment: '视频id,对应video表id' })
  videoId!: number;

  @Column({ type: 'int', nullable: false, comment: '账号id,对应account表id' })
  accountId!: number;

  @Column({
    type: 'varchar',
    enum: AccountType,
    nullable: false,
    comment: '平台类型',
  })
  type!: AccountType;

  // 阅读数量
  @Column({ type: 'int', nullable: false, comment: '阅读数量', default: 0 })
  readCount!: number;

  // 点赞数量
  @Column({ type: 'int', nullable: false, comment: '点赞数量', default: 0 })
  likeCount!: number;

  // 收藏数量
  @Column({ type: 'int', nullable: false, comment: '收藏数量', default: 0 })
  collectCount!: number;

  // 转发数量
  @Column({ type: 'int', nullable: false, comment: '转发数量', default: 0 })
  forwardCount!: number;

  // 评论数量
  @Column({ type: 'int', nullable: false, comment: '评论数量', default: 0 })
  commentCount!: number;

  // 收益(分)
  @Column({ type: 'bigint', nullable: false, comment: '收益', default: 0 })
  income!: number;
}
