/*
 * @Author: nevin
 * @Date: 2025-02-06 15:57:02
 * @LastEditTime: 2025-03-24 15:15:04
 * @LastEditors: nevin
 * @Description:
 */
import { AccountModel } from '../../db/models/account';
import { PlatformBase } from './PlatformBase';
import kwai from './platforms/Kwai';
import xhs from './platforms/xhs';
import douyin from './platforms/douyin';
import wxSph from './platforms/wxSph';
import {
  IAccountInfoParams,
  IGetLocationDataParams,
  IGetUsersParams,
  WorkData,
} from './plat.type';
import { PublishVideoResult } from './module';
import { VideoModel } from '../../db/models/video';
import { PubItemVideo } from './pub/PubItemVideo';
import { AccountType } from '../../../commont/AccountEnum';
import { PubItemImgText } from './pub/PubItemImgText';
import { ImgTextModel } from '../../db/models/imgText';

class PlatController {
  // 所有平台
  private readonly platforms = new Map<AccountType, PlatformBase>();

  constructor() {
    this.platforms.set(AccountType.KWAI, kwai);
    this.platforms.set(AccountType.Xhs, xhs);
    this.platforms.set(AccountType.Douyin, douyin);
    this.platforms.set(AccountType.WxSph, wxSph);
  }

  // 获取平台类实例
  private getPlatform(type: AccountType) {
    const platform = this.platforms.get(type);
    if (!platform) console.warn(`没有这个平台：${type}`);

    return this.platforms.get(type);
  }

  /**
   * 登录某个平台
   * @param type 平台
   * @param params 参数
   */
  public async platlogin(type: AccountType, params?: any) {
    const platform = this.platforms.get(type)!;
    const res = await platform.login(params);
    if (!res || !res.loginCookie) return null;
    // 获取账户信息
    const info = await platform.getAccountInfo({
      cookies: JSON.parse(res.loginCookie),
    });
    if (!!info) res.fansCount = info.fansCount || 0;
    return res;
  }

  /**
   * 平台登录检测
   * @param type 平台
   * @param account
   */
  public async platLoginCheck(type: AccountType, account: AccountModel) {
    const platform = this.platforms.get(type)!;
    return await platform.loginCheck(account);
  }

  /**
   * 发布视频，支持发布到多个平台
   * @param videoModels 视频记录数据
   * @param accountModels 该用户的账号记录数据
   */
  public async videoPublish(
    videoModels: VideoModel[],
    accountModels: AccountModel[],
  ) {
    // 总发布记录状态更新
    const tasks: Promise<PublishVideoResult>[] = [];
    for (const videoModel of videoModels) {
      const platform = this.getPlatform(videoModel.type);
      if (platform) {
        const pubItemVideo = new PubItemVideo(
          accountModels.find((v) => v.id === videoModel.accountId)!,
          videoModel,
          platform,
        );
        tasks.push(pubItemVideo.publishVideo());
      }
    }
    return await Promise.all(tasks);
  }

  /**
   * 发布图文，支持发布到多个平台
   * @param imgTextModels 图文记录数据
   * @param accountModels 该用户的账号记录数据
   */
  public async imgTextPublish(
    imgTextModels: ImgTextModel[],
    accountModels: AccountModel[],
  ) {
    // 总发布记录状态更新
    const tasks: Promise<PublishVideoResult>[] = [];
    for (const videoModel of imgTextModels) {
      const platform = this.getPlatform(videoModel.type);
      if (platform) {
        const pubItemVideo = new PubItemImgText(
          accountModels.find((v) => v.id === videoModel.accountId)!,
          videoModel,
          platform,
        );
        tasks.push(pubItemVideo.publishImgText());
      }
    }
    return await Promise.all(tasks);
  }

  /**
   * 获取某个平台的话题数据
   * @param account
   * @param keyword
   */
  public async getTopic(account: AccountModel, keyword: string) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getTopics({
      keyword,
      account,
    });
  }

  /**
   * 获取某个平台的账户信息
   * @param type 平台
   * @param params 参数
   */
  public async getAccountInfo(type: AccountType, params: IAccountInfoParams) {
    const platform = this.platforms.get(type)!;
    return await platform.getAccountInfo(params);
  }

  /**
   * 获取某个平台的账户统计数据
   * @param account 账户
   */
  public async getStatistics(account: AccountModel) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getStatistics(account);
  }

  /**
   * 获取某个平台的账户面板数据
   * @param account 账户
   * @param time
   */
  public async getDashboard(account: AccountModel, time?: [string, string]) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getDashboard(account, time || []);
  }

  // 获取位置数据
  public async getLocationData(params: IGetLocationDataParams) {
    const platform = this.platforms.get(params.account!.type)!;
    return await platform.getLocationData({
      ...params,
      cookie: JSON.parse(params.account!.loginCookie),
    });
  }

  // 获取用户数据
  public async getUsers(params: IGetUsersParams) {
    const platform = this.platforms.get(params.account!.type)!;
    return await platform.getUsers(params);
  }

  /**
   * 点赞
   * @param account
   * @param dataId
   * @param option
   */
  public async dianzanDyOther(
    account: AccountModel,
    dataId: string,
    option?: any,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.dianzanDyOther(account, dataId, option);
  }

  /**
   * 获取作品列表
   * @param account
   * @param pcursor
   */
  public async shoucangDyOther(account: AccountModel, pcursor?: string) {
    const platform = this.platforms.get(account.type)!;
    return await platform.shoucangDyOther(account, pcursor);
  }

  /**
   * 获取作品列表
   * @param account
   * @param pcursor
   */
  public async getWorkList(account: AccountModel, pcursor?: string) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getWorkList(account, pcursor);
  }

  /**
   * 搜索作品列表
   * @param account
   * @param qe
   * @param pageInfo
   */
  public async getsearchNodeList(
    account: AccountModel,
    qe?: string,
    pageInfo?: any,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getsearchNodeList(account, qe, pageInfo);
  }

  /**
   * 获取评论列表
   * @param account
   * @param data
   * @param pcursor
   */
  public async getCommentList(
    account: AccountModel,
    data: WorkData,
    pcursor?: string,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getCommentList(account, data, pcursor);
  }

  /**
   * 获取评论列表
   * @param account
   * @param data
   * @param pcursor
   */
  public async getCreatorCommentListByOther(
    account: AccountModel,
    data: WorkData,
    pcursor?: string,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getCreatorCommentListByOther(account, data, pcursor);
  }

  // 获取合集
  public async getMixList(account: AccountModel) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getMixList(JSON.parse(account.loginCookie));
  }

  /**
   * 获取二级评论列表
   * @param account
   * @param data
   * @param root_comment_id
   * @param pcursor
   */
  public async getCreatorSecondCommentListByOther(
    account: AccountModel,
    data: WorkData,
    root_comment_id: string,
    pcursor?: string,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.getCreatorSecondCommentListByOther(
      account,
      data,
      root_comment_id,
      pcursor,
    );
  }

  /**
   * 创建评论
   * @param account
   * @param dataId
   * @param content
   */
  public async createComment(
    account: AccountModel,
    dataId: string,
    content: string,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.createComment(account, dataId, content);
  }

  /**
   * 创建评论
   * @param account
   * @param dataId
   * @param content
   */
  public async createCommentByOther(
    account: AccountModel,
    dataId: string,
    content: string,
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.createCommentByOther(account, dataId, content);
  }

  /**
   * 回复评论
   * @param account
   * @param commentId
   * @param content
   * @param option
   */
  public async replyCommentByOther(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.replyCommentByOther(
      account,
      commentId,
      content,
      option,
    );
  }

  /**
   * 回复评论
   * @param account
   * @param commentId
   * @param content
   * @param option
   */
  public async replyComment(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ) {
    const platform = this.platforms.get(account.type)!;
    return await platform.replyComment(account, commentId, content, option);
  }
}

const platController = new PlatController();
export default platController;
