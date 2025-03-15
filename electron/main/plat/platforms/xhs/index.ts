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
        fansCount: userInfo.fansCount,
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
   * 获取作品列表
   * @param account
   * @param pageInfo
   * @returns
   */
  async getWorkList(
    account: AccountModel,
    pageInfo: { pageNo: number; pageSize: number; pcursor?: string },
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await xiaohongshuService.getWorks(cookie);

    const list: WorkData[] = res.data.data.notes.map((v) => ({
      dataId: v.id,
      readCount: v.view_count,
      likeCount: v.likes,
      collectCount: v.collected_count,
      commentCount: v.comments_count,
      title: v.display_title,
      coverUrl: v.images_list[0]?.url || '',
    }));

    return {
      list,
      count: 0,
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

  async getCommentList(account: AccountModel, dataId: string) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);

    const res = await xiaohongshuService.getCommentList(cookie, dataId);
    const list: CommentData[] = res.data.data.comments.map((v) => ({
      dataId: v.note_id,
      commentId: v.id,
      parentCommentId: undefined,
      content: v.content,
      likeCount: Number.parseInt(v.like_count),
      nikeName: v.user_info.nickname,
      headUrl: v.user_info.image,
      data: v,
    }));

    return {
      list: list,
      hasMore: res.data.data.has_more,
      pcursor: res.data.data.cursor,
    };
  }

  async createComment(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const ret = await xiaohongshuService.commentPost(cookie, dataId, content);

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
    const ret = await xiaohongshuService.commentPost(
      cookie,
      option.dataId!,
      content,
      commentId,
    );

    return false;
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
              params.topics?.map((v) => ({
                topicId: v,
                topicName: v,
              })) || [],
            timingTime: params.timingTime?.getTime(),
            privacy: params.visibleType !== VisibleTypeEnum.Public,
            // 位置
            poiInfo: params.location
              ? {
                  poiType: params.location.poi_type!,
                  poiId: params.location.id,
                  poiName: params.location.name,
                  poiAddress: params.location.simpleAddress,
                }
              : undefined,
            // @用户
            mentionedUserInfo: params.mentionedUserInfo
              ? params.mentionedUserInfo.map((v) => {
                  return {
                    nickName: v.label,
                    uid: `${v.value}`,
                  };
                })
              : undefined,
          },
          callback,
        )
        .catch((err) => {
          resolve({
            code: 0,
            msg: err,
          });
        });

      if (!result || !result.publishId)
        return resolve({
          code: 0,
          msg: '网络繁忙，请稍后重试！',
        });

      return resolve({
        code: 1,
        msg: '成功！',
        dataId: result!.publishId,
        videoPubOtherData: {
          [AccountType.Xhs]: {
            xsec_token: result!.works!.xsec_token,
            xsec_source: result!.works!.xsec_source,
          },
        },
      });
    });
  }

  async getUsers(params: IGetUsersParams) {
    const usersRes = await xiaohongshuService.getUsers(
      JSON.parse(params.account.loginCookie),
      params.keyword,
      params.page,
    );
    return {
      status: usersRes.status,
      data: usersRes?.data?.data?.user_info_dtos?.map((v) => {
        return {
          image: v.user_base_dto.image,
          id: v.user_base_dto.red_id,
          name: v.user_base_dto.user_nickname,
        };
      }),
    };
  }

  async getTopics({
    keyword,
    account,
  }: IGetTopicsParams): Promise<IGetTopicsResponse> {
    const res = await xiaohongshuService.getTopics({
      keyword,
      cookies: JSON.parse(account.loginCookie),
    });
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
