import { SocialAccount } from "@/api/types/account.type";

export interface IImgFile {
  id: string;
  size: number;
  file: Blob;
  // 前端临时路径，注意不要存到数据库
  imgUrl: string;
  filename: string;
  // 图片在硬盘上的路径
  imgPath: string;
  // 图片宽度
  width: number;
  // 图片高度
  height: number;
  // 前端上传到oss后的url
  ossUrl?: string;
}

export interface IVideoFile {
  size: number;
  file: Blob;
  // 前端临时路径，注意不要存到数据库
  videoUrl: string;
  // 前端上传到oss后的url
  ossUrl?: string;
  filename: string;
  // 视频宽度
  width: number;
  // 视频高度
  height: number;
  // 视频下取整的时长,单位秒
  duration: number;
  // 视频首帧图片
  cover: IImgFile;
}

export interface IPubParams {
  des: string;
  // 视频和图片不能同时存在，存在图片本次发布则为图文，存在视频则本次发布为视频发布 --------------
  // 图片
  images?: IImgFile[];
  // 视频
  video?: IVideoFile;
  // 话题
  topics?: string[];
  // 标题
  title?: string;
}

export interface PubItem {
  account: SocialAccount;
  params: IPubParams;
}
