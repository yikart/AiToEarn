/*
 * @Author: nevin
 * @Date: 2025-02-08 11:40:45
 * @LastEditTime: 2025-02-19 22:01:59
 * @LastEditors: nevin
 * @Description: 微信视频号
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
  IGetUsersParams,
  IVideoPublishParams,
  PageType,
  VideoCallbackType,
  WorkData,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import { shipinhaoService } from '../../../../plat/shipinhao';
import { AccountType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';
import { CommentInfo } from '../../../../plat/shipinhao/wxShp.type';

export class WxSph extends PlatformBase {
  constructor() {
    super(AccountType.WxSph);
  }

  /**
   * 登录
   * @returns
   */
  async login() {
    try {
      const { success, data, error } =
        await shipinhaoService.loginOrView('login');
      if (!success || !data) {
        console.log('Login process failed:', error);
        return null;
      }

      const userInfo = await shipinhaoService.getUserInfo(data.cookie);

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
      };
    } catch (error) {
      console.error('Login process failed:', error);
      return null;
    }
  }

  async loginCheck(account: AccountModel): Promise<boolean> {
    return await shipinhaoService.checkLoginStatus(account.loginCookie);
  }

  async getAccountInfo(params: IAccountInfoParams): Promise<AccountInfoTypeRV> {
    const res = await shipinhaoService.getUserInfo(params.cookies);

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
    const accountInfo = await shipinhaoService.getUserInfo(cookie);

    return {
      fansCount: accountInfo.fansCount,
      workCount: 0, // TODO: 作品数量
    };
  }

  async getDashboard(account: AccountModel, time: string[] = []) {
    const res: DashboardData[] = [];
    try {
      const cookie: CookiesType = JSON.parse(account.loginCookie);
      console.log('time@.@:', time);
      const ret = await shipinhaoService.getDashboardFunc(
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
   * 获取作品列表
   * @param pageInfo
   * @returns
   */
  async getWorkList(
    account: AccountModel,
    pageInfo: {
      pageNo?: number;
      pageSize?: number;
      pcursor?: string;
    },
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await shipinhaoService.getPostList(cookie, {
      pageNo: pageInfo.pageNo || 1,
      pageSize: pageInfo.pageSize || 20,
    });

    const listData: WorkData[] = res.list.map((item) => {
      return {
        dataId: item.objectId,
        commentCount: item.commentCount,
        title: item.desc.shortTitle[0]?.shortTitle || '',
        desc: item.desc.description,
        coverUrl: item.desc.media[0]?.coverUrl || '',
        videoUrl: item.desc.media[0]?.url || '',
      };
    });

    return {
      list: listData,
      pageInfo: {
        pageType: PageType.paging,
        count: res.totalCount,
      },
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
    pageInfo: {
      pageNo?: number;
      pageSize?: number;
      pcursor?: string;
    },
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await shipinhaoService.getCommentList(cookie, dataId);
    console.log('----- res ----', res);

    const dataList = res.comment.map((item) => {
      return {
        dataId: item.commentId,
        commentId: item.commentId,
        content: item.commentContent,
        nikeName: item.commentNickname,
        headUrl: item.commentHeadurl,
        data: item,
      };
    });

    return {
      list: dataList,
      pageInfo: {
        pageType: PageType.paging,
        count: res.commentCount,
      },
    };
  }

  async createComment(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await shipinhaoService.createComment(cookie, dataId, content);
    return (res.status === 200 || res.status === 201) && res.data.errCode === 0;
  }

  async replyComment(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId: string; // 作品ID
      comment: CommentInfo; // 辅助数据,原数据
    },
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await shipinhaoService.createComment(
      cookie,
      option.dataId,
      content,
      option.comment,
    );
    return false;
  }

  async getUsers(params: IGetUsersParams) {
    const usersRes = await shipinhaoService.getUsers(
      JSON.parse(params.account.loginCookie),
      params.keyword,
      params.page,
    );
    return {
      status:
        usersRes.data.errCode === 300334 || usersRes.data.errCode === 300333
          ? 401
          : usersRes.status,
      data: usersRes?.data?.data?.list?.map((v) => {
        return {
          image: v.headImgUrl,
          id: v.username,
          name: v.nickName,
        };
      }),
    };
  }

  async videoPublish(
    params: IVideoPublishParams,
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const result = await shipinhaoService
        .publishVideoWorkApi(
          params.cookies,
          params.videoPath,
          {
            cover: params.coverPath,
            title: params.desc,
            topics: params.topics,
            des: params.desc,
            timingTime: params.timingTime?.getTime(),
            // 位置
            ...(params.location
              ? {
                  poiInfo: {
                    latitude: params.location.latitude,
                    longitude: params.location.longitude,
                    poiCity: params.location.city,
                    poiName: params.location.name,
                    poiAddress: params.location.simpleAddress,
                    poiId: params.location.id,
                  },
                }
              : {}),
            // @用户
            mentionedUserInfo: params.mentionedUserInfo
              ? params.mentionedUserInfo.map((v) => {
                  return {
                    nickName: v.label,
                  };
                })
              : undefined,
            // 活动
            event: params.diffParams![AccountType.WxSph]!.activity,
          },
          callback,
        )
        .catch((e) => {
          resolve({
            code: 0,
            msg: e,
          });
        });
      if (!result || !result.publishId)
        return resolve({
          code: 0,
          msg: '网络繁忙，请稍后重试',
        });

      return resolve({
        code: 1,
        msg: '成功！',
        dataId: result.publishId,
      });
    });
  }

  async getTopics({}: IGetTopicsParams): Promise<IGetTopicsResponse> {
    return Promise.resolve({
      data: [],
      status: 400,
    });
  }

  async getLocationData(params: IGetLocationDataParams) {
    const locationRes = await shipinhaoService.getLocation({
      ...params,
      query: params.keywords,
      cookie: params.cookie!,
    });
    return {
      status:
        locationRes.data.errCode === 300334 ||
        locationRes.data.errCode === 300333
          ? 401
          : locationRes.status,
      data: locationRes?.data?.data?.list?.map((v) => {
        return {
          name: v.name,
          simpleAddress: v.fullAddress,
          id: v.uid,
          latitude: v.latitude,
          longitude: v.longitude,
          city: v.city,
        };
      }),
    };
  }
}

const wxSph = new WxSph();
export default wxSph;
