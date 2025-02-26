/*
 * @Author: nevin
 * @Date: 2025-02-19 17:54:53
 * @LastEditTime: 2025-02-19 22:45:27
 * @LastEditors: nevin
 * @Description:
 */
import { PlatformBase } from '../../PlatformBase';
import {
  AccountInfoTypeRV,
  IAccountInfoParams,
  IGetTopicsParams,
  IGetTopicsResponse,
  IVideoPublishParams,
  VideoCallbackType,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import { kwaiPub } from '../../../../plat/Kwai';
import { IRequestNetResult } from '../../../../plat/requestNet';
import { IKwaiUserInfoResponse } from '../../../../plat/Kwai/kwai.type';
import { AccountType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';

export class Kwai extends PlatformBase {
  constructor() {
    super(AccountType.KWAI);
  }

  /**
   * 快手账户登录
   */
  async login() {
    const req = await kwaiPub.login();
    const userInfo = this.formatUserInfo(req.userInfo);
    if (!userInfo) return null;
    userInfo.loginCookie = JSON.stringify(req.cookies);
    return userInfo;
  }

  /**
   * 格式化用户信息
   * @param req
   */
  formatUserInfo(req: IRequestNetResult<IKwaiUserInfoResponse>) {
    const { data } = req.data;
    if (!data) return null;
    return {
      userId: '',
      loginCookie: '',
      type: this.type,
      uid: `${data.userId}` || '',
      account: `${data.userId}` || '',
      avatar: data.userAvatar || '',
      nickname: data?.userName || '',
    };
  }

  /**
   * 获取账号信息
   * @param params
   */
  async getAccountInfo(params: IAccountInfoParams): Promise<AccountInfoTypeRV> {
    const res = await kwaiPub.getAccountInfo(params.cookies);
    return this.formatUserInfo(res);
  }

  async videoPublish(
    params: IVideoPublishParams,
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult> {
    const publishVideoResult = new PublishVideoResult();
    const res = await kwaiPub.pubVideo({
      ...params,
      desc: params.desc + params.topics.map((v) => `#${v}`).join(' '),
      callback,
    });
    // 发布失败
    if (!res.success) {
      publishVideoResult.code = 0;
      publishVideoResult.msg = res.msg;
    }
    return publishVideoResult;
  }

  /**
   * TODO: 未实现
   * @returns
   * @param account
   */
  async getStatistics(account: AccountModel) {
    return {};
  }

  async getDashboard(account: AccountModel, time: string[] = []) {
    return [];
  }

  /**
   * TODO: 未实现
   * @returns
   * @param dataId
   */
  async getWorkData(dataId: string) {
    return {};
  }

  async loginCheck(account: AccountModel): Promise<boolean> {
    const res = await kwaiPub.getAccountInfo(JSON.parse(account.loginCookie));
    return !(res.status !== 200 || !res.data.data.userName);
  }

  async getTopics({
    keyword,
    account,
  }: IGetTopicsParams): Promise<IGetTopicsResponse> {
    const res = await kwaiPub.getTopics({
      keyword,
      cookies: JSON.parse(account.loginCookie),
    });
    return {
      status: res.status,
      data: res.data.data.tags.map((v) => {
        return {
          id: v.tag.id,
          name: v.tag.name,
          view_count: v.viewCount,
        };
      }),
    };
  }
}

const kwai = new Kwai();
export default kwai;
