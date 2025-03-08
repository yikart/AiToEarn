/*
 * @Author: nevin
 * @Date: 2025-02-06 15:57:02
 * @LastEditTime: 2025-02-19 22:04:13
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
} from './plat.type';
import { PublishVideoResult } from './module';
import { VideoModel } from '../../db/models/video';
import { PubItemVideo } from './pub/PubItemVideo';
import { AccountType } from '../../../commont/AccountEnum';

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
    return await platform.login(params);
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
}

const platController = new PlatController();
export default platController;
