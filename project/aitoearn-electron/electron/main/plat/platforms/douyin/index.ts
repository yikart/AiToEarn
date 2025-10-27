/*
 * @Author: nevin
 * @Date: 2025-02-08 11:40:45
 * @LastEditTime: 2025-03-31 09:42:25
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
  VideoCallbackType,
  WorkData,
} from '../../plat.type';
import { PublishVideoResult } from '../../module';
import {
  DouyinPlatformSettingType,
  douyinService,
} from '../../../../plat/douyin';
import { PlatType } from '../../../../../commont/AccountEnum';
import { AccountModel } from '../../../../db/models/account';
import { VisibleTypeEnum } from '../../../../../commont/publish/PublishEnum';
import { IRequestNetResult } from '../../../../plat/requestNet';
import { VideoModel } from '../../../../db/models/video';
import { ImgTextModel } from '../../../../db/models/imgText';
import { WorkData as WorkDataModel } from '../../../../db/models/workData';

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
    super(PlatType.Douyin);
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

  async loginCheck(account: AccountModel) {
    const online = await douyinService.checkLoginStatus(account.loginCookie);
    return {
      online,
    };
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
      // console.log('@@@ret.data', ret.data)
      for (const item of ret.data) {
        res.push({
          time: item.date,
          fans: item.zhangfen,
          read: item.bofang,
          comment: item.pinglun,
          like: item.dianzan,
          forward: item.fenxiang,
          collect: 0,
        });
      }
    } catch (error) {
      console.log('------ getDashboard wxSph ---', error);
    }

    return res.reverse();
  }

  /**
   * 获取作品列表
   * @param pageInfo
   * @returns
   */
  async getWorkList(account: AccountModel, pcursor?: string) {
    const res = await douyinService.getCreatorItems(
      JSON.parse(account.loginCookie),
      pcursor,
    );

    const list: WorkData[] = [];
    for (const element of res.data.item_info_list) {
      list.push({
        dataId: element.item_id,
        readCount: undefined,
        likeCount: undefined,
        collectCount: undefined,
        forwardCount: undefined,
        commentCount: element.comment_count,
        income: undefined,
        title: element.title,
        desc: undefined,
        coverUrl: element.cover_image_url,
        videoUrl: undefined,
        createTime: element.create_time,
      });

      pcursor = element.cursor;
    }

    return {
      list: list,
      pageInfo: {
        count: res.data.total_count,
        hasMore: res.data.has_more,
        pcursor: pcursor,
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

  /**
   * 获取搜索作品列表
   * @param account
   * @param data
   * @param pcursor
   * @returns
   */
  async getsearchNodeList(account: AccountModel, qe: string, pageInfo?: any) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    console.log(
      'getsearchNodeList',
      pageInfo.count,
      pageInfo.pcursor,
      pageInfo.postFirstId,
    );
    const res = await douyinService.getSearchNodeList(cookie, qe, {
      count: pageInfo.count,
      pcursor: pageInfo.pcursor,
      postFirstId: pageInfo.postFirstId,
    });

    const list: WorkData[] = [];
    console.log('------douyin getsearchNodeList res: ', res.data.data);
    // console.log('------douyin getsearchNodeList res.data.cursor: ', res.data.cursor);
    for (const s of res.data.data) {
      const v = s.aweme_info;
      list.push({
        dataId: v.aweme_id,
        readCount: v.statistics?.digg_count,
        likeCount: v.statistics?.digg_count,
        collectCount: v.statistics?.collect_count,
        commentCount: v.statistics?.comment_count,
        title: v.desc,
        coverUrl: v.video.cover.url_list[0] || '',
        option: {
          xsec_token: v.xsec_token || '',
        },
        author: {
          name: v.author?.nickname,
          id: v.author?.uid,
          avatar: v.author?.avatar_thumb.url_list[0],
        },
        data: v,
      });
    }

    // console.log('------douyin getsearchNodeList !!res.data.has_more^^: ', !!res.data.has_more);
    return {
      list,
      orgList: res.data,
      pageInfo: {
        count: pageInfo.pcursor,
        pcursor: res.data.cursor + '',
        hasMore: !!res.data.has_more,
      },
    };
  }

  /**
   * 获取评论列表
   * @param account
   * @param data
   * @param pcursor
   * @returns
   */
  async getCommentList(
    account: AccountModel,
    data: WorkData,
    pcursor?: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await douyinService.getCreatorCommentList(cookie, data.dataId, {
      count: pcursor ? 20 : undefined,
      cursor: pcursor || undefined,
    });

    const list: CommentData[] = [];

    for (const v of res.data.comment_info_list) {
      const subList: CommentData[] = [];
      if (v.level === 1 && Number.parseInt(v.reply_count) > 0) {
        const res2 = await douyinService.getCreatorCommentReplyList(
          cookie,
          v.comment_id,
          {
            cursor: 0 + '',
            count: 20,
          },
        );

        if (res2.status === 200 && res2.data.status_code === 0) {
          for (const element of res2.data.comment_info_list) {
            subList.push({
              userId: element.user_info.user_id,
              dataId: data.dataId,
              commentId: element.comment_id,
              content: element.text,
              likeCount: Number.parseInt(element.digg_count),
              nikeName: element.user_info.screen_name,
              headUrl: element.user_info.avatar_url,
              data: element,
              subCommentList: [],
            });
          }
        }
      }

      list.push({
        userId: v.user_info.user_id,
        dataId: data.dataId,
        commentId: v.comment_id,
        content: v.text,
        likeCount: Number.parseInt(v.digg_count),
        nikeName: v.user_info.screen_name,
        headUrl: v.user_info.avatar_url,
        data: v,
        subCommentList: subList,
      });
    }

    return {
      list,
      pageInfo: {
        count: res.data.total_count,
        pcursor: res.data.cursor + '',
        hasMore: res.data.has_more,
      },
    };
  }

  // 其他人作品评论列表
  async getCreatorCommentListByOther(
    account: AccountModel,
    data: WorkData,
    pcursor?: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res: any = await douyinService.getCreatorCommentListByOther(
      cookie,
      data.dataId,
      {
        count: pcursor ? 20 : undefined,
        cursor: pcursor || undefined,
      },
    );

    const list: any[] = [];
    console.log(
      '------ douyinService.getCreatorCommentListByOther',
      res.data.comments,
    );

    for (const v of res.data.comments) {
      list.push({
        userId: v.user.uid,
        dataId: v.aweme_id,
        commentId: v.cid,
        content: v.text,
        likeCount: Number.parseInt(v.digg_count),
        nikeName: v.user.nickname,
        headUrl: v.user.avatar_thumb.url_list[0],
        data: v,
        subCommentList: [],
      });
    }

    return {
      list,
      pageInfo: {
        count: res.data.total_count,
        pcursor: res.data.cursor + '',
        hasMore: res.data.has_more,
      },
    };
  }

  async dianzanDyOther(
    account: AccountModel,
    dataId: string, // 作品ID
  ): Promise<boolean> {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    try {
      const res = await douyinService.creatorDianzanOther(cookie, {
        aweme_id: dataId,
        item_type: 0,
        type: 1,
      });

      return res.status_code === 0;
    } catch (error) {
      console.log('------ error douyin dianzanDyOther ---- ', error);
      return false;
    }
  }

  async shoucangDyOther(
    account: AccountModel,
    dataId: string, // 作品ID
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await douyinService.creatorShoucangOther(cookie, {
      aweme_id: dataId,
      action: 1,
      aweme_type: 0,
    });

    console.log('------ res', res);

    return res;
  }

  async createCommentByOther(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    console.log('dataIddataId????:', dataId, content);
    const res = await douyinService.creatorCommentReplyOther(cookie, {
      aweme_id: dataId,
      text: content,
      one_level_comment_rank: -1,

      // aweme_id: '7498682394024430907',
      // comment_send_celltime: 46567,
      // comment_video_celltime: 8969,
      // one_level_comment_rank: -1,
      // paste_edit_method: 'non_paste',
      // text: '调',
    });

    console.log('-- 评论 ---- res', res);

    return res;
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
    console.log('------ replyCommentByOther1', commentId, option.dataId);

    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await douyinService.creatorCommentReplyOther(cookie, {
      aweme_id: option.dataId || '',
      reply_id: commentId,
      text: content,
      one_level_comment_rank: 1,
    });

    console.log('------ res', res);

    return res;
  }

  async createComment(
    account: AccountModel,
    dataId: string, // 作品ID
    content: string,
  ) {
    const cookie: CookiesType = JSON.parse(account.loginCookie);
    const res = await douyinService.creatorCommentReply(cookie, {
      comment_Id: '',
      item_id: dataId,
      text: content,
    });

    return res.status === 200 && res.data.status_code === 0;
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
    try {
      const res = await douyinService.creatorCommentReply(cookie, {
        comment_Id: commentId,
        item_id: option.dataId!,
        text: content,
      });

      return res.status === 200 && res.data.status_code === 0;
    } catch (error) {
      console.log('------ replyComment ----', error);
      return false;
    }
  }

  pubParamsParse(params: WorkDataModel): DouyinPlatformSettingType {
    const douyinParams = params.diffParams![PlatType.Douyin];
    return {
      proxyIp: params.proxyIp || '',
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
      mixInfo: params.mixInfo
        ? {
            mixId: `${params.mixInfo.value}`,
            mixName: params.mixInfo.label,
          }
        : undefined,
      title: params.title || '',
      topics: params.topics,
      caption: params.desc,
      cover: params.coverPath || '',
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
    };
  }

  async videoPublish(
    params: VideoModel,
    callback: VideoCallbackType,
  ): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const result = await douyinService
        .publishVideoWorkApi(
          JSON.stringify(params.cookies),
          params?.token,
          params.videoPath!,
          this.pubParamsParse(params),
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
        previewVideoLink: result.shareLink,
      });
    });
  }

  async getTopics({ keyword }: IGetTopicsParams): Promise<IGetTopicsResponse> {
    const topicsRes = await douyinService.getTopics({ keyword });
    return {
      status: this.getCode(topicsRes),
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
      status: this.getCode(usersRes),
      data: usersRes?.data?.user_list?.map((v) => {
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
      status: this.getCode(locationRes),
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

  async imgTextPublish(params: ImgTextModel): Promise<PublishVideoResult> {
    return new Promise(async (resolve) => {
      const result = await douyinService
        .publishImageWorkApi(
          JSON.stringify(params.cookies),
          params?.token,
          params.imagesPath,
          this.pubParamsParse(params),
        )
        .catch((e) => {
          resolve({
            code: 0,
            msg: e,
          });
        });
      if (!result?.publishId)
        return resolve({
          code: 0,
          msg: '网络繁忙，请稍后重试',
        });

      return resolve({
        code: 1,
        msg: '发布成功',
        dataId: result.publishId,
        previewVideoLink: result.shareLink,
      });
    });
  }

  getCreatorSecondCommentListByOther(
    account: AccountModel,
    data: WorkData,
    root_comment_id: string,
    pcursor?: string,
  ): Promise<any> {
    return Promise.resolve(undefined);
  }

  getCode(res: IRequestNetResult<any>) {
    return res?.data?.status_code === 8 || res?.data?.status_code === 7
      ? 401
      : res?.status;
  }

  async getMixList(cookie: CookiesType) {
    const mixRes = await douyinService.getMixList(cookie);
    return {
      status: this.getCode(mixRes),
      data: mixRes?.data.mix_list?.map((v) => {
        return {
          id: v.mix_id,
          name: v.mix_name,
          coverImg: v.cover_url.url_list[0],
          feedCount: v.statis.updated_to_episode,
        };
      }),
    };
  }
}

const douyin = new Douyin();
export default douyin;
