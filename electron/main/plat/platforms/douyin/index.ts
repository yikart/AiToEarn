/*
 * @Author: nevin
 * @Date: 2025-02-08 11:40:45
 * @LastEditTime: 2025-03-01 20:03:05
 * @LastEditors: nevin
 * @Description: 抖音
 */
import { PlatformBase } from '../../PlatformBase';
import {
  AccountInfoTypeRV,
  CommentData,
  CookiesType,
  DashboardData,
  IAccountInfoParams,
  IGetLocationDataParams,
  IGetTopicsParams,
  IGetTopicsResponse,
  IGetUsersParams,
  IVideoPublishParams,
  VideoCallbackType,
  WorkData,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import { douyinService } from '../../../../plat/douyin';
import { AccountType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';
import { VisibleTypeEnum } from '../../../../../commont/publish/PublishEnum';

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
        account: userInfo.uid,
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
      fansCount: res.fansCount,
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
   * 获取作品列表
   * @param pageInfo
   * @returns
   */
  async getWorkList(
    account: AccountModel,
    pageInfo: { pageNo?: number; pageSize?: number; pcursor?: string },
  ) {
    const res = await douyinService.getCreatorItems(
      JSON.parse(account.loginCookie),
      pageInfo.pcursor,
    );
    const list: WorkData[] = res.data.item_info_list.map((v) => {
      return {
        dataId: v.item_id,
        cover: v.cover_image_url,
        title: v.title,
        createTime: v.create_time,
        commentCount: v.comment_count,
      };
    });

    return {
      list: list,
      count: res.data.total_count,
    };
  }

  /**
   * TODO: 未实现
   * @returns
   * @param dataId
   */
  async getWorkData(dataId: string) {
    return {
      dataId: '',
    };
  }

  async getCommentList(
    account: AccountModel,
    dataId: string,
    pageInfo?: {
      pageNo?: number;
      pageSize?: number;
      pcursor?: number;
    },
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await douyinService.getCreatorCommentList(cookie, dataId, {
      count: pageInfo?.pageSize || undefined,
      cursor: pageInfo?.pcursor || undefined,
    });

    console.log('===== res ===', res.data.comment_info_list[0]);

    const list: CommentData[] = res.data.comment_info_list.map((v) => {
      return {
        dataId: dataId,
        commentId: v.comment_id,
        content: v.text,
        likeCount: Number.parseInt(v.digg_count),
        nikeName: v.user_info.screen_name,
        headUrl: v.user_info.avatar_url,
        data: v,
      };
    });

    return {
      list,
      count: res.data.total_count,
    };
  }

  async createComment(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ) {
    return false;
  }

  async replyComment(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      data: any; // 辅助数据,原数据
    },
  ) {
    return false;
  }

  async videoPublish(
    params: IVideoPublishParams,
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const douyinParams = params.diffParams![AccountType.Douyin];

      const result = await douyinService
        .publishVideoWorkApi(
          JSON.stringify(params.cookies),
          params.other!,
          params.videoPath,
          {
            userDeclare: douyinParams?.selfDeclare,
            activity: douyinParams?.activitys?.map((v) => {
              return {
                label: v.label,
                value: `${v.value}`,
              };
            }),
            hot_sentence: douyinParams?.hotPoint?.label,
            mentionedUserInfo: params.mentionedUserInfo?.map((v) => {
              return {
                nickName: v.label,
                uid: `${v.value}`,
              };
            }),
            title: params.title,
            topics: params.topics,
            caption: params.desc,
            cover: params.coverPath,
            timingTime: params.timingTime?.getTime(),
            // 可见性
            visibility_type:
              params.visibleType === VisibleTypeEnum.Public
                ? 0
                : params.visibleType === VisibleTypeEnum.Private
                  ? 1
                  : 2,
            // 地址
            ...(params.location
              ? {
                  poiInfo: {
                    poiId: `${params.location.id}`,
                    poiName: params.location.name,
                  },
                }
              : {}),
          },
          callback,
        )
        .catch((e) => {
          resolve({
            code: 0,
            msg: e,
          });
        });
      if (!result.publishId)
        return resolve({
          code: 0,
          msg: '网络繁忙，请稍后重试',
        });

      return resolve({
        code: 1,
        msg: '发布成功',
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

  async getUsers(params: IGetUsersParams) {
    const usersRes = await douyinService.getUsers(
      JSON.parse(params.account.loginCookie),
      params.keyword,
      params.page,
    );
    return {
      status: usersRes.data.status_code === 8 ? 401 : usersRes.status,
      data: usersRes.data.user_list.map((v) => {
        return {
          image: 'https://p26.douyinpic.com/aweme/' + v.avatar_thumb.uri,
          id: v.uid,
          name: v.nickname,
          unique_id: v.unique_id,
          des: '',
          follower_count: v.follower_count,
        };
      }),
    };
  }

  async getLocationData(params: IGetLocationDataParams) {
    const locationRes = await douyinService.getLocation({
      ...params,
      cookie: params.cookie!,
    });

    return {
      status: locationRes.data.status_code === 8 ? 401 : locationRes.status,
      data: locationRes?.data?.poi_list?.map((v) => {
        return {
          name: v.poi_name,
          simpleAddress: v.simple_address_str,
          id: v.poi_id,
          latitude: v.poi_latitude,
          longitude: v.poi_longitude,
          city: v.address_info.city,
        };
      }),
    };
  }
}

const douyin = new Douyin();
export default douyin;
