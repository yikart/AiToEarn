/*
 * @Author: nevin
 * @Date: 2025-01-20 16:24:16
 * @LastEditTime: 2025-02-12 18:31:21
 * @LastEditors: nevin
 * @Description: 视频发布记录 不是数据表实体
 */
import { Column, PrimaryGeneratedColumn } from 'typeorm';
import { TempModel } from './temp';
import { PubStatus } from './pubRecord';
import { AccountType } from '../../../commont/AccountEnum';
import type {
  CookiesType,
  ILocationDataItem,
  WxSphEvent,
} from '../../main/plat/plat.type';
import { DeclarationDouyin } from '../../plat/douyin/common.douyin';
import { VisibleTypeEnum } from '../../../commont/publish/PublishEnum';

// 包含一个name和一个value的对象
export interface ILableValue {
  label: string;
  value: string | number;
}

/**
 * 不同平台的差异化参数
 * 每个平台有相同点，有不同点，这不同点都在这个参数下集合
 */
export type DiffParmasType = {
  [AccountType.Xhs]?: {};
  [AccountType.Douyin]?: {
    // 申请关联的热点
    hotPoint?: ILableValue;
    // 申请关联的活动
    activitys?: ILableValue[];
    // 自主声明
    selfDeclare?: DeclarationDouyin;
  };
  [AccountType.WxSph]?: {
    // 是否为原创
    isOriginal?: boolean;
    // 扩展链接
    extLink?: string;
    // 活动
    activity?: WxSphEvent;
  };
  [AccountType.KWAI]?: {};
};

export type WorkDataModel = WorkData;

export class WorkData extends TempModel {
  // 数据唯一ID
  @Column({ type: 'varchar', nullable: true, comment: '数据唯一ID' })
  dataId?: string;

  @PrimaryGeneratedColumn({ type: 'int', comment: 'id' })
  id?: number;

  @Column({ type: 'varchar', nullable: false, comment: '用户id' })
  userId!: string;

  // 最后统计时间
  @Column({ type: 'datetime', nullable: true, comment: '最后统计时间' })
  lastStatsTime?: Date;

  // 预览地址，这个值是发布完成手动拼接的
  @Column({ type: 'varchar', nullable: true, comment: '预览地址' })
  previewVideoLink?: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '发布记录id,对应PubRecord表id',
  })
  pubRecordId!: number;

  @Column({ type: 'int', nullable: false, comment: '账号id,对应account表id' })
  accountId!: number;

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
    comment: '状态 0 未发布/草稿 1 已发布 2=发布失败 3=部分成功 4=审核中',
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

  // 以下为发布需要的参数 --------------------------------------------------------------------

  // 标题
  @Column({ type: 'varchar', nullable: true, comment: '标题' })
  title?: string;

  // 简介，简介中不该包含话题，如果有需要每个平台再自己做处理。
  @Column({ type: 'varchar', nullable: true, comment: '简介' })
  desc?: string;

  // 封面路径，机器的本地路径
  @Column({ type: 'varchar', nullable: true, comment: '封面路径' })
  coverPath?: string;

  // 合集
  @Column({ type: 'json', nullable: true, comment: '合集' })
  mixInfo?: ILableValue;

  // 话题 格式：['话题1', '话题2']，不该包含 ‘#’
  @Column({ type: 'json', nullable: true, comment: '话题', default: '[]' })
  topics!: string[];

  // 位置
  @Column({ type: 'json', nullable: true, comment: '位置' })
  location?: ILocationDataItem;

  /**
   * 差异化参数
   * 所有平台有通用参数，如：标题、话题、简介
   * 也有每个平台自己独有的参数，如：抖音活动奖励、抖音热点、视频号声明原创
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: '不同平台的差异化参数',
    default: '{}',
  })
  diffParams?: DiffParmasType;

  // 可见性,作品的查看权限
  @Column({
    type: 'tinyint',
    nullable: false,
    comment: '可见性',
    default: VisibleTypeEnum.Private,
  })
  visibleType?: VisibleTypeEnum;

  // 定时发布日期
  @Column({ type: 'datetime', nullable: true, comment: '定时发布日期' })
  timingTime?: Date;

  // @用户
  @Column({ type: 'json', nullable: true, comment: '@用户数组', default: '[]' })
  mentionedUserInfo!: ILableValue[];

  cookies?: CookiesType;
}
