/*
 * @Author: nevin
 * @Date: 2025-02-08 11:40:45
 * @LastEditTime: 2025-02-20 10:24:07
 * @LastEditors: nevin
 * @Description: 抖音
 */
import { PlatformBase } from '../../PlatformBase';
import {
  AccountInfoTypeRV,
  CookiesType,
  DashboardData,
  IAccountInfoParams,
  IGetTopicsParams,
  IGetTopicsResponse,
  IVideoPublishParams,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import { douyinService } from '../../../../plat/douyin';
import { AccountType } from '../../../../../commont/AccountEnum';
import { getNowTimeStamp } from '../../../../util/time';
import { AccountModel } from '../../../../db/models/account';

export type PubVideoOptin = {
  token: string;
  cover: string;
  topics: string[];
  poiInfo?: {
    poiId: string; // "6601136811005708292"
    poiName: string;
  };
};

export class Douyin extends PlatformBase {
  constructor() {
    super(AccountType.Douyin);
  }

  /**
   * 登录
   * @returns
   */
  async login() {
    try {
      const { success, data, error } = await douyinService.loginOrView('login');
      if (!success || !data) {
        console.log('Login process failed:', error);
        return null;
      }

      const userInfo = await douyinService.getUserInfo(data.cookie);

      const loginCookie =
        typeof data.cookie === 'string'
          ? data.cookie
          : JSON.stringify(data.cookie);

      return {
        loginCookie,
        loginTime: new Date(),
        type: this.type,
        uid: userInfo.authorId,
        account: userInfo.authorId,
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
        token: data.localStorage,
      };
    } catch (error) {
      console.error('Login process failed:', error);
      return null;
    }
  }

  async loginCheck(account: AccountModel): Promise<boolean> {
    return await douyinService.checkLoginStatus(account.loginCookie);
  }

  async getAccountInfo(params: IAccountInfoParams): Promise<AccountInfoTypeRV> {
    const res = await douyinService.getUserInfo(params.cookies);

    return {
      type: this.type,
      uid: res.authorId,
      account: res.authorId,
      avatar: res.avatar,
      nickname: res.nickname,
    };
  }

  async getStatistics(account: AccountModel) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);

    const accountInfo = await douyinService.getUserInfo(cookie);
    return {
      fansCount: accountInfo.fansCount,
      workCount: 0, // TODO: 作品数量
    };
  }

  async getDashboard(account: AccountModel, time: string[] = []) {
    const res: DashboardData[] = [];
    try {
      const ret = await douyinService.getDashboardFunc(
        account.loginCookie,
        time[0],
        time[1],
      );
      if (!ret.success) throw new Error('获取三方平台数据失败');
      for (const item of ret.data) {
        res.push({
          fans: item.zhangfen,
          read: item.bofang,
          comment: item.pinglun,
          like: item.dianzan,
          forward: item.fenxiang,
          collect: 0, // TODO: 获取收藏数据
        });
      }
    } catch (error) {
      console.log('------ getDashboard wxSph ---', error);
    }

    return res;
  }

  /**
   * TODO: 未实现
   * @returns
   * @param dataId
   */
  async getWorkData(dataId: string) {
    return {};
  }

  async videoPublish(params: IVideoPublishParams): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const result = await douyinService
        .publishVideoWorkApi(
          JSON.stringify(params.cookies),
          params.other!,
          params.videoPath,
          {
            title: params.title,
            topics: params.topics,
            cover: params.coverPath,
            timingTime: getNowTimeStamp() + '',
          },
          (progress: number, msg?: string) => {
          },
        )
        .catch((e) => {
          resolve({
            code: 0,
            msg: e,
            dataId: '',
          });
        });
      if (!result.publishId)
        return resolve({
          code: 0,
          msg: '',
          dataId: '',
        });

      return resolve({
        code: 1,
        msg: '',
        dataId: result.publishId,
      });
    });
  }

  async getTopics({ keyword }: IGetTopicsParams): Promise<IGetTopicsResponse> {
    const topicsRes = await douyinService.getTopics({ keyword });
    return {
      status: topicsRes.status,
      data: topicsRes?.data?.sug_list?.map((v) => {
        return {
          id: v.cid,
          name: v.cha_name,
          view_count: v.view_count,
        };
      }),
    };
  }
}

const douyin = new Douyin();
export default douyin;
