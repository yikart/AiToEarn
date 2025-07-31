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

// 发布 每个平台的独有参数
export interface IPlatOption {
  bilibili?: {
    // 分区ID，由获取分区信息接口得到
    tid?: number;
    // 1-原创，2-转载(转载时source必填)
    copyright?: number;
    // 如果copyright为转载，则此字段表示转载来源
    source?: string;
  };
  facebook?: {
    // 页面ID，由获取Facebook页面信息接口得到
    page_id?: string;
    // 内容类型：video(Post)、reel(Reel)、story(Story)
    content_category?: string;
  };
  youtube?: {
    // 隐私状态：public、unlisted、private
    privacyStatus?: string;
    // 国区代码
    regionCode?: string;
    // 视频分类ID
    categoryId?: string;
  };
}

// 发布参数
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
  // 发布 每个平台的独有参数
  option: IPlatOption;
}

// 发布数据 item
export interface PubItem {
  account: SocialAccount;
  params: IPubParams;
}

// b站分区 item
export interface BiblPartItem {
  description: string;
  id: number;
  name: string;
  parent: number;
  children: BiblPartItem[];
}

// YouTube视频分类 item
export interface YouTubeCategoryItem {
  id: string;
  name: string;
  description?: string;
}
