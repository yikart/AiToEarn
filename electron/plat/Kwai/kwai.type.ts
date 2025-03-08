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
