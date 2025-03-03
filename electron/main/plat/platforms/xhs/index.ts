/*
 * @Author: nevin
 * @Date: 2025-02-08 11:40:45
 * @LastEditTime: 2025-02-20 16:22:00
 * @LastEditors: nevin
 * @Description: 小红书
 */
import { PlatformBase } from '../../PlatformBase';
import {
  AccountInfoTypeRV,
  CookiesType,
  DashboardData,
  IAccountInfoParams,
  IGetLocationDataParams,
  IGetTopicsParams,
  IGetTopicsResponse,
  IVideoPublishParams,
  VideoCallbackType,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import { xiaohongshuService } from '../../../../plat/xiaohongshu';
import { AccountType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';
import { VisibleTypeEnum } from '../../../../../commont/publish/PublishEnum';

export class Xhs extends PlatformBase {
  constructor() {
    super(AccountType.Xhs);
  }

  /**
   * 登录
   * @returns
   */
  async login() {
    try {
      const { success, data, error } =
        await xiaohongshuService.loginOrView('login');
      if (!success || !data) {
        console.log('Login process failed:', error);
        return null;
      }

      const userInfo = await xiaohongshuService.getUserInfo(data.cookie);

      const loginCookie =
        typeof data.cookie === 'string'
          ? data.cookie
          : JSON.stringify(data.cookie);

      // 入库
      return {
        loginCookie,
        type: this.type,
        uid: userInfo.authorId,
        account: userInfo.authorId,
        avatar: userInfo.avatar,
        nickname: userInfo.nickname,
      };
    } catch (error) {
      console.error('Login process failed:', error);
      return null;
    }
  }

  async loginCheck(account: AccountModel): Promise<boolean> {
    try {
      const userInfo = await xiaohongshuService.getUserInfo(
        JSON.parse(account.loginCookie),
      );
      return !!userInfo.authorId;
    } catch (error) {
      console.log('-----xhs loginCheck-- error', error);

      return false;
    }
  }

  async getAccountInfo(params: IAccountInfoParams): Promise<AccountInfoTypeRV> {
    try {
      const userInfo = await xiaohongshuService.getUserInfo(params.cookies);
      return userInfo;
    } catch (error) {
      console.log('-----xhs loginCheck-- error', error);

      return null;
    }
  }

  async getStatistics(account: AccountModel) {
    const accountInfo = await xiaohongshuService.getUserInfo(
      JSON.parse(account.loginCookie),
    );
    return {
      fansCount: accountInfo.fansCount,
      workCount: 0, // TODO: 作品数量
    };
    return {};
  }

  async getDashboard(account: AccountModel, time: string[] = []) {
    const res: DashboardData[] = [];
    try {
      const cookie: CookiesType = JSON.parse(account.loginCookie);
      const ret = await xiaohongshuService.getDashboardFunc(
        cookie,
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
  /**
   * @param params
   * @param callback
   * @returns
   */
  async videoPublish(
    params: IVideoPublishParams,
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const result = await xiaohongshuService
        .publishVideoWorkApi(
          JSON.stringify(params.cookies),
          params.videoPath,
          {
            cover: params.coverPath,
            desc: params.desc,
            title: params.title,
            topicsDetail:
              params.diffParams?.[AccountType.Xhs]?.topicsDetail || [],
            timingTime: params.timingTime?.getTime(),
            privacy: params.visibleType !== VisibleTypeEnum.Public,
          },
          callback,
        )
        .catch((err) => {
          resolve({
            code: 0,
            msg: err,
            dataId: '',
          });
        });

      if (result && !result.publishId)
        return resolve({
          code: 0,
          msg: '',
          dataId: '',
        });

      return resolve({
        code: 1,
        msg: '',
        dataId: result!.publishId,
      });
    });
  }

  async getTopics({
    keyword,
    account,
  }: IGetTopicsParams): Promise<IGetTopicsResponse> {
    const res = await xiaohongshuService.getTopics({
      keyword,
      cookies: JSON.parse(account.loginCookie),
    });
    console.log(res);
    return {
      status: res.status,
      data: res?.data?.data?.topic_info_dtos?.map((v) => {
        return {
          id: v.id,
          name: v.name,
          view_count: v.view_num,
        };
      }),
    };
  }

  async getLocationData(params: IGetLocationDataParams) {
    const locationRes = await xiaohongshuService.getLocations({
      ...params,
      keyword: params.keywords,
      cookies: params.cookie!,
    });
    return {
      status: locationRes.status,
      data: locationRes?.data?.data?.poi_list?.map((v) => {
        return {
          name: v.name,
          simpleAddress: v.full_address,
          id: v.poi_id,
          poi_type: v.poi_type,
          latitude: v.latitude,
          longitude: v.longitude,
          city: v.city_name,
        };
      }),
    };
  }
}

const xhs = new Xhs();
export default xhs;
