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
  CookiesType,
  DashboardData,
  IAccountInfoParams,
  IGetLocationDataParams,
  IGetLocationResponse,
  IGetMixListResponse,
  IGetTopicsParams,
  IGetTopicsResponse,
  IGetUsersParams,
  IGetUsersResponse,
  ResponsePageInfo,
  StatisticsData,
  VideoCallbackType,
  WorkData,
} from './plat.type';
import { PublishVideoResult } from './module';
import { AccountType } from '../../../commont/AccountEnum';
import { AccountModel } from '../../db/models/account';
import { VideoModel } from '../../db/models/video';
import { ImgTextModel } from '../../db/models/imgText';

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
  abstract loginCheck(account: AccountModel): Promise<{
    // true=在线，false=离线
    online: boolean;
    // 要额外更新的账户数据
    account?: Partial<AccountModel>;
  }>;

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
   * 点赞
   * @param account 账户
   * @param dataId 数据ID
   * @param option 配置项
   */
  abstract dianzanDyOther(
    account: AccountModel,
    dataId: string,
    option?: any,
  ): Promise<any>;

  /**
   * 收藏
   * @param account 账户
   * @param pcursor 分页游标
   */
  abstract shoucangDyOther(
    account: AccountModel,
    pcursor?: string,
  ): Promise<any>;

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
   * 搜索作品
   * @param account 账户
   * @param qe 搜索关键词
   * @param pageInfo 分页信息
   */
  abstract getsearchNodeList(
    account: AccountModel,
    qe?: string,
    pageInfo?: any,
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
    workData: WorkData,
    pcursor?: string,
  ): Promise<{
    list: CommentData[];
    pageInfo: ResponsePageInfo;
  }>;

  /**
   * 获取他人作品的二级评论列表
   * @param account
   * @param dataId
   * @param pcursor
   */
  abstract getCreatorSecondCommentListByOther(
    account: AccountModel,
    workData: WorkData,
    root_comment_id: string,
    pcursor?: string,
  ): Promise<any>;

  /**
   * 获取评论列表
   * @param account
   * @param dataId
   * @param pcursor
   */
  abstract getCreatorCommentListByOther(
    account: AccountModel,
    workData: WorkData,
    pcursor?: string,
  ): Promise<{
    list: CommentData[];
    orgList?: any;
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
    authorId?: string,
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
      videoAuthId?: string; // 视频作者ID
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
   * 视频发布
   */
  abstract videoPublish(
    params: VideoModel,
    // 获取发布进度的回调函数
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult>;

  /**
   * 图文发布，有些平台不支持图文发布
   */
  imgTextPublish(params: ImgTextModel): Promise<PublishVideoResult> {
    throw `平台${this.type}不支持图文发布`;
  }

  // 获取合集
  getMixList(cookie: CookiesType): Promise<IGetMixListResponse> {
    throw `平台${this.type}不支持获取合集`;
  }

  // 话题数据获取
  abstract getTopics(params: IGetTopicsParams): Promise<IGetTopicsResponse>;

  // 获取位置数据
  abstract getLocationData(
    params: IGetLocationDataParams,
  ): Promise<IGetLocationResponse>;

  // 获取@用户数据
  abstract getUsers(params: IGetUsersParams): Promise<IGetUsersResponse>;
}
