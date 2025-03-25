/*
 * @Author: nevin
 * @Date: 2025-02-07 09:48:29
 * @LastEditTime: 2025-03-24 15:14:58
 * @LastEditors: nevin
 * @Description: 平台主类
 */
import {
  AccountInfoTypeRV,
  CommentData,
  DashboardData,
  IAccountInfoParams,
  IGetLocationDataParams,
  IGetLocationResponse,
  IGetTopicsParams,
  IGetTopicsResponse,
  IGetUsersParams,
  IGetUsersResponse,
  IVideoPublishParams,
  ResponsePageInfo,
  StatisticsData,
  VideoCallbackType,
  WorkData,
} from './plat.type';
import { PublishVideoResult } from './module';
import { AccountType } from '../../../commont/AccountEnum';
import { AccountModel } from '../../db/models/account';

/**
 * 平台基类，所有平台都该继承这个类
 */
export abstract class PlatformBase {
  // 平台类型
  protected readonly type: AccountType;

  constructor(type: AccountType) {
    this.type = type;
  }

  /**
   * 平台登录
   * @param params
   */
  abstract login(params?: any): Promise<AccountInfoTypeRV>;

  /**
   * 登录状态检测
   * @param account
   */
  abstract loginCheck(account: AccountModel): Promise<boolean>;

  /**
   * 获取该平台的用户信息
   * @param params
   */
  abstract getAccountInfo(
    params: IAccountInfoParams,
  ): Promise<AccountInfoTypeRV>;

  /**
   * 获取统计数据
   * @param account 账号
   */
  abstract getStatistics(account: AccountModel): Promise<StatisticsData>;

  /**
   * 获取账户的看板数据
   * @param account 账号
   * @param time
   */
  abstract getDashboard(
    account: AccountModel,
    time: string[],
  ): Promise<DashboardData[]>;

  /**
   * 获取作品列表
   * @param account 账户
   * @param pcursor 分页游标
   */
  abstract getWorkList(
    account: AccountModel,
    pcursor?: string,
  ): Promise<{
    list: WorkData[];
    pageInfo: ResponsePageInfo;
  }>;

  /**
   * 获取某个作品的数据
   * @param dataId 作品的唯一标识
   */
  abstract getWorkData(dataId: string): Promise<WorkData>;

  /**
   * 获取评论列表
   * @param account
   * @param dataId
   * @param pcursor
   */
  abstract getCommentList(
    account: AccountModel,
    dataId: string,
    pcursor?: string,
  ): Promise<{
    list: CommentData[];
    pageInfo: ResponsePageInfo;
  }>;

  /**
   * 获取他人作品的评论列表
   * @param account
   * @param dataId
   * @param pcursor
   */
  abstract getCreatorCommentListByOther(
    account: AccountModel,
    dataId: string,
    pcursor?: string,
  ): Promise<{
    list: CommentData[];
    pageInfo: ResponsePageInfo;
  }>;

  /**
   * 获取评论列表
   * @param account
   * @param dataId
   * @param pcursor
   */
  abstract getCreatorCommentListByOther(
    account: AccountModel,
    dataId: string,
    pcursor?: string,
  ): Promise<{
    list: CommentData[];
    pageInfo: ResponsePageInfo;
  }>;

  /**
   * 创建评论
   */
  abstract createComment(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ): Promise<boolean>;



  /**
   * 创建评论
   */
  abstract createCommentByOther(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ): Promise<any>;

  /**
   * 回复评论
   */
  abstract replyCommentByOther(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ): Promise<any>;


  /**
   * 回复评论
   */
  abstract replyComment(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ): Promise<boolean>;

  /**
   * 在该平台发布视频
   */
  abstract videoPublish(
    params: IVideoPublishParams,
    // 获取发布进度的回调函数
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult>;

  // 获取这个平台的话题
  abstract getTopics(params: IGetTopicsParams): Promise<IGetTopicsResponse>;

  // 获取位置数据
  abstract getLocationData(
    params: IGetLocationDataParams,
  ): Promise<IGetLocationResponse>;

  // 获取@用户数据
  abstract getUsers(params: IGetUsersParams): Promise<IGetUsersResponse>;
}
