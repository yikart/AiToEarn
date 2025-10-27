/*
 * @Author: nevin
 * @Date: 2025-02-08 11:40:45
 * @LastEditTime: 2025-03-24 23:35:03
 * @LastEditors: nevin
 * @Description: 微信视频号
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
  ResponsePageInfo,
  VideoCallbackType,
  WorkData,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import { shipinhaoService } from '../../../../plat/shipinhao';
import { PlatType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';
import { CommentInfo } from '../../../../plat/shipinhao/wxShp.type';
import { IRequestNetResult } from '../../../../plat/requestNet';
import { VideoModel } from '../../../../db/models/video';

export class WxSph extends PlatformBase {
  constructor() {
    super(PlatType.WxSph);
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

  async loginCheck(account: AccountModel) {
    const online = await shipinhaoService.checkLoginStatus(account.loginCookie);
    return {
      online,
    };
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
  async getWorkList(account: AccountModel, pcursor?: string) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const pageNo = pcursor ? Number.parseInt(pcursor) : 1;
    const res = await shipinhaoService.getPostList(cookie, {
      pageNo: pageNo,
      pageSize: 20,
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
        count: res.totalCount,
        hasMore: res.totalCount > res.list.length * pageNo,
        pcursor:
          res.totalCount > res.list.length * pageNo ? pageNo + 1 + '' : '',
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
    data: WorkData,
    pcursor?: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await shipinhaoService.getCommentList(cookie, data.dataId);

    const dataList: CommentData[] = [];

    for (const item of res.comment) {
      const subDataList: CommentData[] = [];
      for (const subItem of item.levelTwoComment) {
        subDataList.push({
          userId: subItem.commentNickname,
          dataId: subItem.commentId,
          commentId: subItem.commentId,
          parentCommentId: item.commentId,
          content: subItem.commentContent,
          nikeName: subItem.commentNickname,
          headUrl: subItem.commentHeadurl,
          data: subItem,
          subCommentList: [],
        });
      }

      dataList.push({
        userId: item.commentNickname,
        dataId: item.commentId,
        commentId: item.commentId,
        content: item.commentContent,
        nikeName: item.commentNickname,
        headUrl: item.commentHeadurl,
        data: item,
        subCommentList: subDataList,
      });
    }

    const pcursorNum = +(pcursor || 0);

    return {
      list: dataList,
      pageInfo: {
        count: res.commentCount,
        hasMore: res.commentCount > res.comment.length * pcursorNum,
        pcursor:
          res.commentCount > res.comment.length * pcursorNum
            ? pcursorNum + 1 + ''
            : '',
      },
    };
  }

  async getCreatorCommentListByOther(
    account: AccountModel,
    data: WorkData,
    pcursor?: string,
  ) {
    return {
      list: [],
      pageInfo: {
        count: 0,
        pcursor: '',
        hasMore: false,
      },
    };
  }

  getCreatorSecondCommentListByOther(
    account: AccountModel,
    data: WorkData,
    root_comment_id: string,
    pcursor?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {});
  }

  async createCommentByOther(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ) {
    return null;
  }

  async replyCommentByOther(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ) {
    return null;
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

  getCode(res: IRequestNetResult<any>) {
    return res.data.errCode === 300334 || res.data.errCode === 300333
      ? 401
      : res.status;
  }

  async getUsers(params: IGetUsersParams) {
    const usersRes = await shipinhaoService.getUsers(
      JSON.parse(params.account.loginCookie),
      params.keyword,
      params.page,
    );

    return {
      status: this.getCode(usersRes),
      data: usersRes?.data?.data?.list?.map((v) => {
        return {
          image: v.headImgUrl,
          id: v.username,
          name: v.nickName,
        };
      }),
    };
  }

  async getMixList(cookie: CookiesType) {
    const mixRes = await shipinhaoService.getMixList(cookie);
    return {
      status: this.getCode(mixRes),
      data: mixRes?.data?.data?.collectionList?.map((v) => {
        return {
          id: v.id,
          name: v.name,
          coverImg: v.coverImgUrl || '',
          feedCount: v.feedCount,
        };
      }),
    };
  }

  async videoPublish(
    params: VideoModel,
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const wxSphParams = params.diffParams![PlatType.WxSph]!;
      const result = await shipinhaoService
        .publishVideoWorkApi(
          params.cookies!,
          params.videoPath!,
          {
            proxy: params.proxyIp || '',
            mixInfo: params.mixInfo
              ? {
                  mixId: `${params.mixInfo.value}`,
                  mixName: params.mixInfo.label,
                }
              : undefined,
            postFlag: wxSphParams.isOriginal ? 1 : 0,
            cover: params.coverPath!,
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
            event: wxSphParams.activity,
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
      status: this.getCode(locationRes),
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

  /**
   * 点赞
   */
  dianzanDyOther(account: AccountModel, pcursor?: string): Promise<any> {
    return new Promise((resolve, reject) => {});
  }

  /**
   * 收藏
   */
  shoucangDyOther(account: AccountModel, pcursor?: string): Promise<any> {
    return new Promise((resolve, reject) => {});
  }

  getsearchNodeList(
    account: AccountModel,
    pcursor?: string,
  ): Promise<{
    list: WorkData[];
    pageInfo: ResponsePageInfo;
  }> {
    throw '无此方法';
  }
}

const wxSph = new WxSph();
export default wxSph;
