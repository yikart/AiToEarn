import requestNet, { IRequestNetParams } from '../requestNet';
import {
  CommentAddResponse,
  GetCommentListResponse,
  GetPhotoListResponse,
  GetSubCommentListResponse,
  IGetHomeInfoResponse,
  IGetHomeOverview,
  IKwaiGetLocationsResponse,
  IKwaiGetTopicsResponse,
  IKwaiGetUsersResponse,
  IKwaiPubVideoParams,
  IKwaiUserInfoResponse,
  ILoginResponse,
} from './kwai.type';
import { CookieToString } from '../utils';
import { BrowserWindow } from 'electron';
import kwaiSign from './sign/KwaiSign';

interface IRequestApiParams extends IRequestNetParams {
  cookie: Electron.Cookie[];
}

class KwaiPub {
  // 发布视频
  async pubVideo(params: IKwaiPubVideoParams): Promise<{
    success: boolean;
    msg: string;
  }> {
    return new Promise(async (resolve) => {
      console.log('快手图文发布');
    });
  }

  // 发送请求
  async requestApi<T>(params: IRequestApiParams) {
    const { cookie } = params;

    if (params.method === 'POST') {
      params['body'] = {
        ...(params['body'] ? params['body'] : {}),
        'kuaishou.web.cp.api_ph': cookie.find(
          (v) => v.name === 'kuaishou.web.cp.api_ph',
        )!.value,
      };
    }

    params['headers'] = {
      ...(params['headers'] ? params['headers'] : {}),
      cookie: CookieToString(cookie),
    };

    const signUrl = await kwaiSign.sign({
      json: params.body || {},
      type: 'json',
      url: params.url,
    });

    console.log('signUrl：', signUrl);

    return await requestNet<T>({
      ...params,
      url: `https://cp.kuaishou.com${signUrl}`,
    });
  }

  async getHomeOverview(cookie: Electron.Cookie[]) {
    return await this.requestApi<IGetHomeOverview>({
      cookie,
      url: '/rest/cp/creator/analysis/pc/home/author/overview',
      method: 'POST',
      body: {
        timeType: 3,
      },
    });
  }

  // 快手登录
  login(): Promise<ILoginResponse> {
    return new Promise(async (resolve, reject) => {
      const partition = Date.now().toString();
      const mainWindow = new BrowserWindow({
        width: 1300,
        height: 600,
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: false,
          partition,
        },
      });
      await mainWindow.loadURL(
        'https://passport.kuaishou.com/pc/account/login/?sid=kuaishou.web.cp.api&callback=https%3A%2F%2Fcp.kuaishou.com%2Frest%2Finfra%2Fsts%3FfollowUrl%3Dhttps%253A%252F%252Fcp.kuaishou.com%252Fprofile%26setRootDomain%3Dtrue',
      );

      // 监听 URL 跳转（导航）事件
      mainWindow.webContents.on('did-navigate', async () => {
        const cookies = await mainWindow.webContents.session.cookies.get({
          url: 'https://id.kuaishou.com/pass/kuaishou/login/passToken?sid=kuaishou.web.cp.api',
        });
        // 存在关键cookie
        if (cookies.some((v) => v.name === 'passToken')) {
          const userInfoReq = await this.getAccountInfo(cookies);
          if (userInfoReq.status === 200 && userInfoReq.data.data) {
            mainWindow.close();
            resolve({
              cookies,
              userInfo: userInfoReq,
            });
          } else {
            reject('获取用户信息失败');
          }
        }
      });
    });
  }

  // 获取账户的粉丝数、关注、获赞
  async getHomeInfo(cookie: Electron.Cookie[]) {
    return await this.requestApi<IGetHomeInfoResponse>({
      cookie: cookie,
      url: '/rest/cp/creator/pc/home/infoV2',
      method: 'POST',
    });
  }

  // 获取账号信息
  async getAccountInfo(cookie: Electron.Cookie[]) {
    return await this.requestApi<IKwaiUserInfoResponse>({
      cookie: cookie,
      url: '/rest/v2/creator/pc/authority/account/current',
      method: 'POST',
    });
  }

  // 获取话题
  async getTopics({
    keyword,
    cookies,
  }: {
    keyword: string;
    cookies: Electron.Cookie[];
  }) {
    return await this.requestApi<IKwaiGetTopicsResponse>({
      cookie: cookies,
      url: `/rest/cp/works/v2/video/pc/tag/search`,
      method: 'POST',
      body: {
        keyword,
      },
    });
  }

  // 获取关注用户
  async getUsers({
    page,
    cookies,
  }: {
    page: number;
    cookies: Electron.Cookie[];
  }) {
    return await this.requestApi<IKwaiGetUsersResponse>({
      cookie: cookies,
      url: `/rest/cp/works/v2/video/pc/at/list`,
      method: 'POST',
      body: {
        atType: 3,
        pageCount: page,
        pageSize: 10,
      },
    });
  }

  // 获取快手位置
  async getLocations({
    cookies,
    cityName,
    keyword,
  }: {
    cookies: Electron.Cookie[];
    cityName: string;
    keyword: string;
  }) {
    return await this.requestApi<IKwaiGetLocationsResponse>({
      cookie: cookies,
      url: `/rest/zt/location/wi/poi/search?kpn=kuaishou_cp&subBiz=CP%2FCREATOR_PLATFORM&kuaishou.web.cp.api_ph=fe283c2f058ddb7a3098f89511fbd536dd82`,
      method: 'POST',
      body: {
        cityName,
        count: 50,
        keyword,
        pcursor: '',
      },
    });
  }

  /**
   * 获取作品列表
   * @param cookies
   * @param pcursor
   * @returns
   */
  async getPhotoList(
    cookies: Electron.Cookie[],
    pcursor?: number, // 下一页页码
  ) {
    const res = await this.requestApi<GetPhotoListResponse>({
      cookie: cookies,
      url: `/rest/cp/creator/comment/photoList`,
      method: 'POST',
      body: {
        ...(pcursor ? { pcursor } : {}),
      },
    });
    return res;
  }

  // 获取评论列表
  async getCommentList(
    cookies: Electron.Cookie[],
    photoId: string,
    pcursor?: number,
  ) {
    const res = await this.requestApi<GetCommentListResponse>({
      cookie: cookies,
      url: `/rest/cp/creator/comment/commentList`,
      method: 'POST',
      body: {
        photoId,
        sortType: '',
        selectedComment: false,
        ...(pcursor ? { pcursor } : {}),
      },
    });

    console.log('----------- getCommentList --- res: ', res);

    return res;
  }

  // 获取评论的回复列表
  async getSubCommentList(
    cookies: Electron.Cookie[],
    photoId: string,
    commentId: number,
  ) {
    const res = await this.requestApi<GetSubCommentListResponse>({
      cookie: cookies,
      url: `/rest/cp/creator/comment/subCommentList`,
      method: 'POST',
      body: {
        commentId, // 969549966791,
        photoId, //'3xsq95w5uxvjx7q',
      },
    });

    return res;
  }

  /**
   * 添加评论和回复评论
   * @param cookie
   * @param photoId
   * @param content
   * @param reply
   * @returns
   */
  async commentAdd(
    cookie: Electron.Cookie[],
    content: string,
    reply: {
      photoId?: string;
      replyToCommentId?: number; // 969549966791;
      replyTo?: number; // 798319351;
    },
  ) {
    const res = await this.requestApi<CommentAddResponse>({
      cookie: cookie,
      url: '/rest/cp/creator/comment/add',
      method: 'POST',
      body: {
        content,
        ...reply,
      },
    });

    console.log('---- douyin commentAdd ----', res);

    return res;
  }
}

export const kwaiPub = new KwaiPub();
