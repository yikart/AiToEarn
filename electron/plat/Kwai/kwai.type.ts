import { IRequestNetResult } from '../requestNet';
import { KwaiVisibleTypeEnum } from '../plat.common.type';

interface AbConfig {
  cpPublishNewPage2024: boolean;
  enableGaoXinLaHuiSwitch: boolean;
  cpPublishSearch: boolean;
  favorAbGroupWithGray: number;
  enableNewGrowthTaskV2: boolean;
  enableNewHomeVersionV4: boolean;
  enablePhotoFavorV2Switch: boolean;
}

export interface IKwaiUserCommonResponse<T> {
  result: number;
  currentTime: number;
  'host-name': string;
  data: T;
  message: string;
}

// video/pc/upload/pre
export type UploadPpreResponse = IKwaiUserCommonResponse<{
  token: string;
  fileId: number;
}>;

// video/pc/upload/finish
export type UploadFinishResponse = IKwaiUserCommonResponse<{
  coverKey: string;
  coverMediaId: string;
  duration: number;
  fileId: number;
  height: number;
  mediaId: string;
  photoIdStr: string;
  videoDuration: string;
  videoFrameRate: string;
  width: string;
}>;

// /v2/video/pc/submit
export type KwaiSubmitResponse = IKwaiUserCommonResponse<{
  result: number;
  message: string;
}>;

export interface IGetHomeOverviewItem {
  name: string;
  tab: string;
  sumCount: number;
  endDayCount: number;
  interpretDesc: string | null;
  trendData: {
    date: string;
    count: number;
  }[];
  diagnoseResultType: string;
}

export interface IGetHomeOverview {
  result: number;
  currentTime: number;
  'host-name': string;
  data: {
    basicData: IGetHomeOverviewItem[];
    dataUpdateTime: string;
  };
  message: string;
}

export interface IGetHomeInfoResponse {
  data: {
    desc: string;
    fansCnt: number;
    followCnt: number;
    likeCnt: number;
    userId: number;
    userName: string;
    userKwaiId?: number;
  };
}

// 快手用户信息接口返回的数据
export type IKwaiUserInfoResponse = IKwaiUserCommonResponse<{
  ab: AbConfig;
  role: number;
  isGrOrPr: boolean;
  roles: number[];
  userAvatar: string;
  userName: string;
  userId: number;
  article: boolean;
  logined: boolean;
  enableNotificationV3: boolean;
  appType: number;
  userKwaiId: null;
  showCreator: boolean;
}>;

interface TopicsTag {
  id: number;
  name: string;
  data: any;
  status: number;
  karaoke: any;
}

// 获取快手话题接口返回的数据
export type IKwaiGetTopicsResponse = IKwaiUserCommonResponse<{
  result: number;
  ussid: string;
  pcursor: string;
  tags: {
    tag: TopicsTag;
    viewCount: number;
  }[];
}>;

// 获取快手关注用户返回的数据
export type IKwaiGetUsersResponse = IKwaiUserCommonResponse<{
  list: {
    userName: string;
    userId: number;
    fansCount: number;
    headUrl: string;
  }[];
  name: string;
  type: number;
}>;

// 获取快手位置数据
export type IKwaiGetLocationsResponse = {
  locations: {
    id: number;
    title: string;
    address: string;
    city: string;
    category: number;
    latitude: number;
    longitude: number;
    idString: string;
  }[];
  pcursor: string;
  result: number;
};

// 快手视频发布入参
export interface IKwaiPubVideoParams {
  // cookies
  cookies: Electron.Cookie[];
  // 发布视频的简介
  desc: string;
  // 视频的路径
  videoPath: string;
  // 封面路径
  coverPath: string;
  // 视频可见性
  visibleType: KwaiVisibleTypeEnum;
  // 发布回调，可以用于获取发布进度
  callback: (progress: number, msg?: string) => void;
}

// 登录返回参数
export interface ILoginResponse {
  cookies: Electron.Cookie[];
  userInfo: IRequestNetResult<IKwaiUserInfoResponse>;
}

// 获取作品列表
export interface GetPhotoListResponse {
  result: number; // 1;
  currentTime: number; // 1741842574582;
  'host-name': string; // 'public-bjxy-rs9-kce-node961.idcyz.hb1.kwaidc.com';
  data: {
    photoList: {
      photoId: string; // '3xsq95w5uxvjx7q';
      title: string; // '';
      cover: string; // 'https://p2.a.yximgs.com/upic/2025/02/24/21/BMjAyNTAyMjQyMTQ4NDFfNzk4MzE5MzUxXzE1Nzc4MzY4MTM2MV8wXzM=_B05f8067d6793fd47dcbb196af577f7ae.jpg?tag=1-1741842574-nil-0-uacnaa9n5n-f19cc27a1c6378c5&clientCacheKey=3xsq95w5uxvjx7q.jpg&di=b7c6874b&bp=10000';
      playCount: number; // 6;
      likeCount: number; // 0;
      commentCount: number; // 2;
      uploadTime: number; // 1740404944454;
      duration: number; // 13300;
      isVideo: true;
      isSettingSelectedComment: boolean; // false;
      photoSelectedTips: any; // null;
    }[];
    pcursor: number; // 1515253882683; // 下一页页码
    totalCount: number; // 2;
    visionSearchPhoto: {
      feeds: any[];
    };
    result?: string;
  };
  message: string; // '成功';
}

// 获取评论列表
export interface GetCommentListResponse {
  result: number; // 1;
  currentTime: number; // 1741843263417;
  'host-name': string; // 'public-bjxy-rs9-kce-node961.idcyz.hb1.kwaidc.com';
  data: {
    pcursor?: number; // 971109198576;
    list: [
      {
        photoId: number; // 157783681361;
        authorId: number; // 798319351;
        headurl: string; // 'https://p66-pro.a.yximgs.com/uhead/AB/2018/01/06/23/BMjAxODAxMDYyMzQ4MjRfNzk4MzE5MzUxXzJfaGQ4OTBfMTcz_s.jpg';
        authorName: string; // '墨2668';
        commentId: number; // 969549966791;
        content: string; // '哈哈哈';
        replyTo: number; // 0;
        replyToUserName: any; // null;
        replyToCommentId: number; // 0;
        timestamp: number; // 1741695330721;
        likedCount: number; // 0;
        liked: boolean; // false;
        subCommentCount: number; // 1;
        emotionId: any; // null;
        emotion: any; // null;
        ip: number; // 0;
        referer: any; // null;
        toped: boolean; // false;
        settingSelectedComment: boolean; // false;
        isSettingSelectedComment: boolean; // false;
      },
    ];
  };
  message: string; // '成功';
}

// 获取子回复列表
export interface GetSubCommentListResponse {
  result: number; // 1;
  currentTime: number; // 1741843273188;
  'host-name': string; // 'public-bjx-c26-kce-node710.idchb1az1.hb1.kwaidc.com';
  data: {
    list: {
      photoId: number; // 157783681361;
      authorId: number; // 798319351;
      headurl: string; // 'https://p66-pro.a.yximgs.com/uhead/AB/2018/01/06/23/BMjAxODAxMDYyMzQ4MjRfNzk4MzE5MzUxXzJfaGQ4OTBfMTcz_s.jpg';
      authorName: string; // '墨2668';
      commentId: number; // 969618657810;
      content: string; // '666';
      replyTo: number; // 798319351;
      replyToUserName: string; // '墨2668';
      replyToCommentId: number; // 0;
      timestamp: number; // 1741704937506;
      likedCount: number; // 0;
      liked: boolean; // false;
      subCommentCount: number; // 0;
      emotionId: any; // null;
      emotion: any; // null;
      ip: number; // 0;
      referer: any; // null;
      toped: boolean; // false;
      settingSelectedComment: boolean; // false;
      isSettingSelectedComment: boolean; // false;
    }[];
  };
  message: string; // '成功';
}

// 创建评论返回参数
export interface CommentAddResponse {
  result: number; // 1;
  currentTime: number; // 1741704937529;
  'host-name': string; // 'public-bjx-c26-kce-node717.idchb1az1.hb1.kwaidc.com';
  data: {
    commentId: number; // 969618657810;
  };
  message: string; // '成功';
}
