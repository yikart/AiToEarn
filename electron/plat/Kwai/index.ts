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
  KwaiSubmitResponse,
  UploadFinishResponse,
  UploadPpreResponse,
} from './kwai.type';
import { CookieToString } from '../utils';
import { BrowserWindow, screen } from 'electron';
import kwaiSign from './sign/KwaiSign';
import { FileUtils } from '../../util/file';
import { getFilePathNameCommon } from '../../../commont/utils';
import FormData from 'form-data';
import fs from 'fs';

interface IRequestApiParams extends IRequestNetParams {
  cookie: Electron.Cookie[];
  apiUrl?: string;
}

class KwaiPub {
  fileBlockSize = 4194304;

  // 普通参数转换为快手参数
  convertKwaiParams(params: IKwaiPubVideoParams) {
    const kwaiParams: any = {};
    kwaiParams['caption'] = params.desc;

    // 好友处理
    if (params.mentions) {
      kwaiParams['caption'] += ` ${params.mentions.join(' ')} `;
    }

    // 话题处理
    if (params.topics) {
      kwaiParams['caption'] += ` ${params.topics.join(' ')} `;
    }

    // 位置处理
    if (params.poiInfo) {
      kwaiParams['poiId'] = params.poiInfo.poiId;
      kwaiParams['latitude'] = params.poiInfo.latitude;
      kwaiParams['longitude'] = params.poiInfo.longitude;
    }

    return {
      ...kwaiParams,
      photoStatus: params.photoStatus,
      publishTime: params.publishTime || 0,
    };
  }
  // 发布视频
  async pubVideo(params: IKwaiPubVideoParams): Promise<{
    publishId: string;
    shareLink: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const callback = params.callback;
        callback(5, '正在视频分片...');
        const { filename, suffix } = getFilePathNameCommon(params.videoPath);
        const filePartInfo = await FileUtils.getFilePartInfo(
          params.videoPath,
          this.fileBlockSize,
        );
        callback(10, '正在创建视频...');
        const preRes = await this.requestApi<UploadPpreResponse>({
          url: '/rest/cp/works/v2/video/pc/upload/pre',
          cookie: params.cookies,
          method: 'POST',
          body: {
            uploadType: 1,
          },
        });
        console.log('创建视频：', preRes);
        if (!preRes.data.data) {
          throw new Error(preRes.data.message);
        }

        for (const i in filePartInfo.blockInfo) {
          callback(40, `上传视频（${i}/${filePartInfo.blockInfo.length}）`);
          const chunkStart =
            i === '0' ? 0 : filePartInfo.blockInfo[parseInt(i) - 1];
          const chunkEnd = filePartInfo.blockInfo[i] - 1;
          const chunkContent = await FileUtils.getFilePartContent(
            params.videoPath,
            chunkStart,
            chunkEnd,
          );
          const uploadVideoRes = await requestNet({
            method: 'POST',
            url: `https://upload.kuaishouzt.com/api/upload/fragment?upload_token=${preRes.data.data.token}&fragment_id=${i}`,
            isFile: true,
            body: chunkContent,
          });
          console.log(`分片上传：（${i}/${filePartInfo.blockInfo.length}）`);
          console.log(uploadVideoRes.data);
        }

        callback(60, `查询分片上传结果...`);
        const completeRes = await this.requestApi({
          apiUrl: `https://upload.kuaishouzt.com/api/upload/complete?upload_token=${preRes.data.data.token}&fragment_count=${filePartInfo.blockInfo.length}`,
          method: 'POST',
          cookie: params.cookies,
          body: {
            uploadType: 1,
          },
        });
        console.log(`分片上传完成：`, completeRes.data);

        callback(70, `分片上传完成，视频上传结束...`);
        const finishRes = await this.requestApi<UploadFinishResponse>({
          url: `/rest/cp/works/v2/video/pc/upload/finish`,
          method: 'POST',
          cookie: params.cookies,
          body: {
            token: preRes.data.data.token,
            fileName: filename,
            fileType: `video/${suffix}`,
            fileLength: filePartInfo.fileSize,
          },
        });
        if (finishRes.data.result !== 1)
          throw new Error(finishRes.data.message);
        console.log(`视频上传结束：`, finishRes.data);

        callback(80, `视频上传完成，正在上传封面...`);
        const formData = new FormData();
        formData.append('file', fs.createReadStream(params.coverPath));
        const coverRes = await this.requestApi<{
          data: {
            coverKey: string;
          };
        }>({
          formData,
          url: '/rest/cp/works/v2/video/pc/upload/cover/upload',
          method: 'POST',
          cookie: params.cookies,
        });
        console.log('上传封面结果：', coverRes.data);

        callback(90, `正在发布...`);

        const submitParams = {
          ...finishRes.data.data,
          coverKey: coverRes.data.data.coverKey,
          coverTimeStamp: 0,
          coverType: 1,
          coverTitle: '',
          photoType: 0,
          collectionId: '',
          publishTime: 0,
          longitude: '',
          latitude: '',
          poiId: 0,
          notifyResult: 0,
          domain: '',
          secondDomain: '',
          coverCropped: false,
          pkCoverKey: '',
          profileCoverKey: '',
          downloadType: 1,
          disableNearbyShow: false,
          allowSameFrame: true,
          movieId: '',
          openPrePreview: false,
          declareInfo: {},
          activityIds: [],
          riseQuality: false,
          chapters: [],
          projectId: '',
          recTagIdList: [],
          videoInfoMeta: '',
          previewUrlErrorMessage: '',
          triggerH265: false,
          ...this.convertKwaiParams(params),
        };
        console.log('发布参数:', submitParams);
        const submitRes = await this.requestApi<KwaiSubmitResponse>({
          url: `/rest/cp/works/v2/video/pc/submit`,
          method: 'POST',
          cookie: params.cookies,
          body: submitParams,
        });
        console.log(`视频发布完成：`, submitRes.data);
        console.log(submitRes.data.result);
        if (submitRes.data.result !== 1) {
          return reject(submitRes.data.message);
        }
        console.log('发布成功！');
        resolve({
          shareLink: ``,
          publishId: '1',
        });
      } catch (e: any) {
        reject(`发布失败,失败原因：${e.message}`);
      }
    });
  }

  // 发送请求
  async requestApi<T>(params: IRequestApiParams) {
    const { cookie, apiUrl = 'https://cp.kuaishou.com' } = params;

    const api_ph = cookie.find(
      (v) => v.name === 'kuaishou.web.cp.api_ph',
    )!.value;

    if (params.formData) {
      params.formData.append('kuaishou.web.cp.api_ph', api_ph);
    } else if (params.method === 'POST') {
      params['body'] = {
        ...(params['body'] ? params['body'] : {}),
        'kuaishou.web.cp.api_ph': api_ph,
      };
    }

    params['headers'] = {
      ...(params['headers'] ? params['headers'] : {}),
      cookie: CookieToString(cookie),
    };

    const signUrl = await kwaiSign.sign({
      json: !params.formData
        ? params.body || {}
        : {
            'kuaishou.web.cp.api_ph': api_ph,
          },
      type: params.formData ? 'form-data' : 'json',
      url: `${apiUrl}${params.url || ''}`,
    });

    return await requestNet<T>({
      ...params,
      url: `${apiUrl == 'https://cp.kuaishou.com' ? signUrl : apiUrl}`,
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
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      const mainWindow = new BrowserWindow({
        width: Math.ceil(width * 0.8),
        height: Math.ceil(height * 0.8),
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: false,
          partition,
        },
      });
      // 登录页面
      await mainWindow.loadURL(
        'https://passport.kuaishou.com/pc/account/login',
      );
      mainWindow.webContents.openDevTools();
      let timeId1: NodeJS.Timeout | undefined = undefined;
      let timeId2: NodeJS.Timeout | undefined = undefined;
      mainWindow.on('closed', () => {
        clearInterval(timeId1);
        clearInterval(timeId2);
      });
      timeId1 = setInterval(async () => {
        const cookies = await mainWindow.webContents.session.cookies.get({});
        // 存在关键cookie
        if (cookies.some((v) => v.name === 'kuaishou.server.webday7_ph')) {
          clearInterval(timeId1);
          // 开发者后台
          await mainWindow.loadURL(
            'https://cp.kuaishou.com/article/publish/video?origin=www.kuaishou.com',
          );
          // 检测创作者中心登录
          timeId2 = setInterval(async () => {
            const cookies = await mainWindow.webContents.session.cookies.get(
              {},
            );
            // 存在关键cookie
            if (cookies.some((v) => v.name === 'ks_onvideo_token')) {
              const cookiesLast =
                await mainWindow.webContents.session.cookies.get({});
              const userInfoReq = await this.getAccountInfo(cookiesLast);
              if (userInfoReq.status === 200 && userInfoReq.data.data) {
                clearInterval(timeId2);
                mainWindow.close();
                resolve({
                  cookies: cookiesLast,
                  userInfo: userInfoReq,
                });
              } else {
                clearInterval(timeId2);
                reject('获取用户信息失败');
              }
            }
          }, 1500);
        }
      }, 1500);
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

  // 搜索作品列表
  async getsearchNodeList(
    cookies: Electron.Cookie[],
    qe: string,
    pageInfo?: any,
  ) {
    const bodys: any = {
      operationName: 'visionSearchPhoto',
      variables: {
        keyword: qe,
        pcursor: pageInfo.pcursor < 1 ? '' : pageInfo.pcursor + '',
        page: 'search',
      },
      query: `fragment photoContent on PhotoEntity {\n  __typename\n  id\n  duration\n  caption\n  originCaption\n  likeCount\n  viewCount\n  commentCount\n  realLikeCount\n  coverUrl\n  photoUrl\n  photoH265Url\n  manifest\n  manifestH265\n  videoResource\n  coverUrls {\n    url\n    __typename\n  }\n  timestamp\n  expTag\n  animatedCoverUrl\n  distance\n  videoRatio\n  liked\n  stereoType\n  profileUserTopPhoto\n  musicBlocked\n  riskTagContent\n  riskTagUrl\n}\n\nfragment recoPhotoFragment on recoPhotoEntity {\n  __typename\n  id\n  duration\n  caption\n  originCaption\n  likeCount\n  viewCount\n  commentCount\n  realLikeCount\n  coverUrl\n  photoUrl\n  photoH265Url\n  manifest\n  manifestH265\n  videoResource\n  coverUrls {\n    url\n    __typename\n  }\n  timestamp\n  expTag\n  animatedCoverUrl\n  distance\n  videoRatio\n  liked\n  stereoType\n  profileUserTopPhoto\n  musicBlocked\n  riskTagContent\n  riskTagUrl\n}\n\nfragment feedContent on Feed {\n  type\n  author {\n    id\n    name\n    headerUrl\n    following\n    headerUrls {\n      url\n      __typename\n    }\n    __typename\n  }\n  photo {\n    ...photoContent\n    ...recoPhotoFragment\n    __typename\n  }\n  canAddComment\n  llsid\n  status\n  currentPcursor\n  tags {\n    type\n    name\n    __typename\n  }\n  __typename\n}\n\nquery visionSearchPhoto($keyword: String, $pcursor: String, $searchSessionId: String, $page: String, $webPageArea: String) {\n  visionSearchPhoto(keyword: $keyword, pcursor: $pcursor, searchSessionId: $searchSessionId, page: $page, webPageArea: $webPageArea) {\n    result\n    llsid\n    webPageArea\n    feeds {\n      ...feedContent\n      __typename\n    }\n    searchSessionId\n    pcursor\n    aladdinBanner {\n      imgUrl\n      link\n      __typename\n    }\n    __typename\n  }\n}\n`,
    };

    if (pageInfo.postFirstId) {
      bodys.variables.searchSessionId = pageInfo.postFirstId;
    }

    // console.log('----------- getsearchNodeList --- bodys: ', bodys);

    const res = await this.requestApi<any>({
      cookie: cookies,
      apiUrl: 'https://www.kuaishou.com/graphql',
      method: 'POST',
      body: bodys,
      headers: {
        Referer: `https://www.kuaishou.com/search?keyword=${qe}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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

    return res;
  }

  /**
   * 点赞
   * @param cookie
   * @param photoId
   * @param content
   * @param reply
   * @returns
   */
  async dianzanDyOther(cookie: Electron.Cookie[], dataId: string, option: any) {
    const res = await this.requestApi<CommentAddResponse>({
      cookie: cookie,
      apiUrl: 'https://www.kuaishou.com/graphql',
      method: 'POST',
      body: {
        operationName: 'visionVideoLike',
        variables: {
          photoId: dataId,
          photoAuthorId: option.authid,
          cancel: 0,
          expTag: '1_i/2008189535617610417_xpcwebdetailxxnull0',
        },
        query: `mutation visionVideoLike($photoId: String, $photoAuthorId: String, $cancel: Int, $expTag: String) {\n  visionVideoLike(photoId: $photoId, photoAuthorId: $photoAuthorId, cancel: $cancel, expTag: $expTag) {\n    result\n    __typename\n  }\n}\n`,
      },
      headers: {
        Referer: `https://www.kuaishou.com/short-video/${dataId}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    return res;
  }

  /**
   * 视频评论
   * @param cookie
   * @param photoId
   * @param content
   * @param reply
   * @returns
   */
  async videoCommentByOther(
    cookie: Electron.Cookie[],
    dataId: string,
    content: string,
    authorId?: string,
  ) {
    const res = await this.requestApi<CommentAddResponse>({
      cookie: cookie,
      apiUrl: 'https://www.kuaishou.com/graphql',
      method: 'POST',
      body: {
        operationName: 'visionAddComment',
        variables: {
          photoId: dataId,
          photoAuthorId: authorId,
          content: content,
          expTag: '1_a/2004436422502146722_xpcwebdetailxxnull0',
        },
        query:
          'mutation visionAddComment($photoId: String, $photoAuthorId: String, $content: String, $replyToCommentId: ID, $replyTo: ID, $expTag: String) {\n  visionAddComment(photoId: $photoId, photoAuthorId: $photoAuthorId, content: $content, replyToCommentId: $replyToCommentId, replyTo: $replyTo, expTag: $expTag) {\n    result\n    commentId\n    content\n    timestamp\n    status\n    __typename\n  }\n}\n',
      },
      headers: {
        Referer: `https://www.kuaishou.com/short-video/${dataId}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    return res;
  }

  /**
   * 获取视频评论列表
   * @param cookie
   * @param photoId
   * @param content
   * @param reply
   * @returns
   */
  async getVideoCommentList(
    cookie: Electron.Cookie[],
    dataId: string,
    pcursor?: string,
  ) {
    const res = await this.requestApi<any>({
      cookie: cookie,
      apiUrl: 'https://www.kuaishou.com/graphql',
      method: 'POST',
      body: {
        operationName: 'commentListQuery',
        variables: {
          pcursor: '',
          photoId: dataId,
        },
        query:
          'query commentListQuery($photoId: String, $pcursor: String) {\n  visionCommentList(photoId: $photoId, pcursor: $pcursor) {\n    commentCount\n    pcursor\n    rootComments {\n      commentId\n      authorId\n      authorName\n      content\n      headurl\n      timestamp\n      likedCount\n      realLikedCount\n      liked\n      status\n      authorLiked\n      subCommentCount\n      subCommentsPcursor\n      subComments {\n        commentId\n        authorId\n        authorName\n        content\n        headurl\n        timestamp\n        likedCount\n        realLikedCount\n        liked\n        status\n        authorLiked\n        replyToUserName\n        replyTo\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n',
      },
      headers: {
        Referer: `https://www.kuaishou.com/short-video/${dataId}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    return res;
  }

  /**
   * 回复二级评论
   * @param cookie
   * @param commentId
   * @param content
   * @param option
   * @returns
   */

  async replyCommentByOther(
    cookie: Electron.Cookie[],
    content: string,
    option: {
      replyToCommentId?: any; // 969549966791;
      replyTo?: any; // 798319351;
      photoId?: string; // 作品ID
      photoAuthorId: any; // 视频作者ID
    },
  ) {
    console.log('------ replyCommentByOther option ----', {
      photoId: option.photoId,
      photoAuthorId: option.photoAuthorId,
      content: content,
      replyToCommentId: option.replyToCommentId,
      replyTo: option.replyTo,
      expTag: '1_a/2004436422502146722_xpcwebdetailxxnull0',
    });

    const res = await this.requestApi<any>({
      cookie: cookie,
      apiUrl: 'https://www.kuaishou.com/graphql',
      method: 'POST',
      body: {
        operationName: 'visionAddComment',
        variables: {
          photoId: option.photoId,
          photoAuthorId: option.photoAuthorId,
          content: content,
          replyToCommentId: option.replyToCommentId,
          replyTo: option.replyTo,
          expTag: '1_a/2004436422502146722_xpcwebdetailxxnull0',
        },
        query:
          'mutation visionAddComment($photoId: String, $photoAuthorId: String, $content: String, $replyToCommentId: ID, $replyTo: ID, $expTag: String) {\n  visionAddComment(photoId: $photoId, photoAuthorId: $photoAuthorId, content: $content, replyToCommentId: $replyToCommentId, replyTo: $replyTo, expTag: $expTag) {\n    result\n    commentId\n    content\n    timestamp\n    status\n    __typename\n  }\n}\n',
      },
      headers: {
        Referer: `https://www.kuaishou.com/short-video/${option.photoId}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    return res;
  }
}

export const kwaiPub = new KwaiPub();
