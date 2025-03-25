/*
 * @Author: nevin
 * @Date: 2025-02-19 17:54:53
 * @LastEditTime: 2025-03-25 13:18:41
 * @LastEditors: nevin
 * @Description:
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
import { kwaiPub } from '../../../../plat/Kwai';
import { IRequestNetResult } from '../../../../plat/requestNet';
import { IKwaiUserInfoResponse } from '../../../../plat/Kwai/kwai.type';
import { AccountType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';
import { VisibleTypeEnum } from '../../../../../commont/publish/PublishEnum';
import { KwaiVisibleTypeEnum } from '../../../../plat/plat.common.type';
import dayjs from 'dayjs';

export class Kwai extends PlatformBase {
  constructor() {
    super(AccountType.KWAI);
  }

  /**
   * 快手账户登录
   */
  async login() {
    const req = await kwaiPub.login();
    const userInfo = await this.formatUserInfo(req.userInfo, req.cookies);
    if (!userInfo) return null;
    userInfo.loginCookie = JSON.stringify(req.cookies);
    return userInfo;
  }

  /**
   * 格式化用户信息
   * @param req
   * @param cookies
   */
  async formatUserInfo(
    req: IRequestNetResult<IKwaiUserInfoResponse>,
    cookies: Electron.Cookie[],
  ) {
    const { data } = req.data;
    const res = await kwaiPub.getHomeInfo(cookies);
    if (!data) return null;
    return {
      userId: '',
      loginCookie: '',
      type: this.type,
      uid: `${data.userId}` || '',
      account: `${data.userId}` || '',
      avatar: data.userAvatar || '',
      nickname: data?.userName || '',
      fansCount: res.data.data.fansCnt,
    };
  }

  /**
   * 获取账号信息
   * @param params
   */
  async getAccountInfo(params: IAccountInfoParams): Promise<AccountInfoTypeRV> {
    const res = await kwaiPub.getAccountInfo(params.cookies);
    return await this.formatUserInfo(res, params.cookies);
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
      visibleType: VisibleTypeEnum.Public
        ? KwaiVisibleTypeEnum.Public
        : VisibleTypeEnum.Friend
          ? KwaiVisibleTypeEnum.Friend
          : KwaiVisibleTypeEnum.Private,
    });
    // 发布失败
    if (!res.success) {
      publishVideoResult.code = 0;
      publishVideoResult.msg = res.msg;
    }
    return publishVideoResult;
  }

  async getStatistics(account: AccountModel) {
    const res = await kwaiPub.getHomeInfo(JSON.parse(account.loginCookie));
    return {
      fansCount: res?.data?.data?.fansCnt,
      workCount: 0,
    };
  }

  async getDashboard(account: AccountModel, time: string[] = []) {
    const res = await kwaiPub.getHomeOverview(JSON.parse(account.loginCookie));
    const dashboard: DashboardData[] = [];
    const startTime = new Date(time[0]).getTime();
    const endTime = new Date(time[1]).getTime();

    res?.data?.data?.basicData?.map((v1, i1) => {
      v1.trendData.map((v2, i2) => {
        const currTime = dayjs(v2.date, 'YYYYMMDD').valueOf();
        if (currTime >= startTime && currTime <= endTime) {
          if (!dashboard[i2])
            dashboard[i2] = {
              comment: 0,
              fans: 0,
              forward: 0,
              like: 0,
              read: 0,
              time: '',
              collect: 0, // TODO: 获取收藏数据
            };
          const item = dashboard[i2];

          item.time = v2.date;
          if (v1.tab === 'LIKE') {
            item.like = v2.count;
          } else if (v1.tab === 'PURE_INCREASE_FAN') {
            item.fans = v2.count;
          } else if (v1.tab === ' COMMENT') {
            item.comment = v2.count;
          } else if (v1.tab === 'SHARE') {
            item.forward = v2.count;
          } else if (v1.tab === 'PLAY') {
            item.read = v2.count;
          }
        }
      });
    });

    return dashboard.filter(Boolean);
  }

  /**
   * 获取作品列表
   * @param pageInfo
   * @returns
   */
  async getWorkList(account: AccountModel, pcursor?: string) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await kwaiPub.getPhotoList(cookie, Number(pcursor));

    const photoList = res.data.data.photoList;
    const list: WorkData[] = photoList.map((v) => {
      return {
        dataId: v.photoId,
        readCount: v.playCount,
        likeCount: v.likeCount,
        commentCount: v.commentCount,
        title: v.title,
        coverUrl: v.cover,
      };
    });

    return {
      list,
      pageInfo: {
        hasMore: !!res.data.data.pcursor,
        count: res.data.data.totalCount,
        pcursor: res.data.data.pcursor + '',
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
    pcursor?: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await kwaiPub.getCommentList(
      cookie,
      dataId,
      pcursor ? Number.parseInt(pcursor) : undefined,
    );

    const list: CommentData[] = [];
    for (const v of res.data.data.list) {
      const subList: CommentData[] = [];

      if (!!v.subCommentCount) {
        const subRes = await kwaiPub.getSubCommentList(
          cookie,
          dataId,
          v.commentId,
        );

        for (const v1 of subRes.data.data.list) {
          subList.push({
            userId: v1.authorId + '',
            dataId: v1.photoId + '',
            commentId: v1.commentId + '',
            content: v1.content,
            likeCount: undefined,
            nikeName: v1.headurl,
            headUrl: v1.headurl,
            data: v1,
            subCommentList: [],
          });
        }
      }

      list.push({
        userId: v.authorId + '',
        dataId: v.photoId + '',
        commentId: v.commentId + '',
        parentCommentId: undefined,
        content: v.content,
        likeCount: undefined,
        nikeName: v.headurl,
        headUrl: v.headurl,
        data: v,
        subCommentList: subList,
      });
    }

    return {
      list: list,
      pageInfo: {
        count: 0,
        pcursor: res.data.data.pcursor + '',
        hasMore: !!res.data.data.pcursor,
      },
    };
  }

  async getCreatorCommentListByOther(
    account: AccountModel,
    dataId: string,
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
    const res = await kwaiPub.commentAdd(cookie, dataId, content, {});
    console.log('------ kaishou createComment res ----', res);

    return false;
  }

  async replyComment(
    account: AccountModel,
    commentId: string,
    content: string,
    option: {
      dataId?: string; // 作品ID
      comment: any; // 辅助数据,原数据
    },
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);

    const res = await kwaiPub.commentAdd(cookie, option.dataId!, content, {
      replyToCommentId: Number.parseInt(commentId),
      replyTo: Number.parseInt(option.dataId!),
    });
    console.log('------ kaishou createComment res ----', res);

    return false;
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
      data: res.data?.data?.tags?.map((v) => {
        return {
          id: v.tag.id,
          name: v.tag.name,
          view_count: v.viewCount,
        };
      }),
    };
  }

  async getUsers(params: IGetUsersParams) {
    const res = await kwaiPub.getUsers({
      page: params.page,
      cookies: JSON.parse(params.account.loginCookie),
    });

    return {
      status: res.status,
      data: res.data?.data?.list?.map((v) => {
        return {
          image: v.headUrl,
          id: `${v.userId}`,
          name: v.userName,
          follower_count: v.fansCount,
        };
      }),
    };
  }

  async getLocationData(params: IGetLocationDataParams) {
    const res = await kwaiPub.getLocations({
      cookies: params.cookie!,
      cityName: params.cityName,
      keyword: params.keywords,
    });
    return {
      status: res.status,
      data: res.data?.locations?.map((v) => {
        return {
          name: v.title,
          simpleAddress: v.address,
          id: `${v.id}`,
          latitude: v.latitude,
          longitude: v.longitude,
          city: v.city,
        };
      }),
    };
  }
}

const kwai = new Kwai();
export default kwai;
