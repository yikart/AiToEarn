/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-12 18:32:28
 * @LastEditors: nevin
 * @Description: 视频发布记录
 */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { WorkData } from './workData';
import {
  DouyinDeclareEnum,
  VisibleTypeEnum,
} from '../../../commont/publish/PublishEnum';
import { AccountType } from '@@/AccountEnum';

// 包含一个name和一个value的对象
export interface ILableValue {
  label: string;
  value: string | number;
}
export type TopicsArrType = ILableValue[];

/**
 * 不同平台的差异化参数
 * 每个平台有相同点，有不同点，这不同点都在这个参数下集合
 */
export type DiffParmasType = {
  [AccountType.Xhs]?: {
    // 小红书的话题格式
    topicsDetail?: {
      topicId: string;
      topicName: string;
    }[];
  };
  [AccountType.Douyin]?: {
    // 申请关联的热点
    hotPoint?: ILableValue;
    // 自主声明
    selfDeclare?: DouyinDeclareEnum;
  };
  [AccountType.WxSph]?: {
    // 是否未原创
    isOriginal?: boolean;
    // 扩展链接
    extLink?: string;
    // 活动
    activity?: ILableValue;
  };
  [AccountType.KWAI]?: {};
};

@Entity({ name: 'video' })
export class VideoModel extends WorkData {
  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id?: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '发布记录id,对应PubRecord表id',
  })
  pubRecordId!: number;

  @Column({ type: 'int', nullable: false, comment: '账号id,对应account表id' })
  accountId!: number;

  // 标题
  @Column({ type: 'varchar', nullable: true, comment: '标题' })
  title?: string;

  // 简介
  @Column({ type: 'varchar', nullable: true, comment: '简介' })
  desc?: string;

  // 视频路径
  @Column({ type: 'varchar', nullable: true, comment: '视频路径' })
  videoPath?: string;

  // 封面路径
  @Column({ type: 'varchar', nullable: true, comment: '封面路径' })
  coverPath?: string;

  // 最后统计时间
  @Column({ type: 'datetime', nullable: true, comment: '最后统计时间' })
  lastStatsTime?: Date;

  // 话题
  @Column({ type: 'json', nullable: true, comment: '话题' })
  topics?: TopicsArrType;

  // 位置
  @Column({ type: 'json', nullable: true, comment: '位置' })
  location?: ILableValue;

  // 差异化参数
  @Column({ type: 'json', nullable: true, comment: '不同平台的差异化参数' })
  diffParams?: DiffParmasType;

  // 定时发布日期
  @Column({ type: 'datetime', nullable: true, comment: '定时发布日期' })
  timingTime?: Date;

  // 视频可见性
  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '视频可见性',
    default: VisibleTypeEnum.Private,
  })
  visibleType?: VisibleTypeEnum;
}
