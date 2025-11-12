import { SocialAccount } from "@/api/types/account.type";

export interface IImgFile {
  id: string;
  size: number;
  file: File;
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
  // 上传任务ID（用于取消/进度追踪）
  uploadTaskId?: string;
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
  // 上传任务ID（用于取消/进度追踪）
  uploadTaskIds?: {
    video?: string;
    cover?: string;
  };
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
  wxGzh?: {
    // 平台独立标题，仅用于微信公众号
    title?: string;
  };
  facebook?: {
    // 页面ID，由获取Facebook页面信息接口得到
    page_id?: string;
    // 内容类型：post(Post)、reel(Reel)、story(Story)
    content_category?: string;
  };
  instagram?: {
    // 内容类型：post(Post)、reel(Reel)、story(Story)
    content_category?: string;
  };
  youtube?: {
    // 隐私状态：public、unlisted、private
    privacyStatus?: string;
    // 许可证类型：youtube、creativeCommon
    license?: string;
    // 视频分类ID
    categoryId?: string;
    // 是否通知订阅者
    notifySubscribers?: boolean;
    // 是否允许嵌入
    embeddable?: boolean;
    // 是否为儿童内容
    selfDeclaredMadeForKids?: boolean;
  };
  pinterest?: {
    // Board ID，由获取Pinterest Board信息接口得到
    boardId?: string;
  };
  tiktok?: {
    // 隐私级别：PUBLIC_TO_EVERYONE、MUTUAL_FOLLOW_FRIENDS、SELF_ONLY
    privacy_level?: string;
    // 是否禁用评论
    comment_disabled?: boolean;
    // 是否禁用合拍
    duet_disabled?: boolean;
    // 是否禁用拼接
    stitch_disabled?: boolean;
    // 品牌有机内容开关
    brand_organic_toggle?: boolean;
    // 品牌内容开关
    brand_content_toggle?: boolean;
  };
  threads?: {
    // 位置信息
    location_id?: string | null;
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
  snippet: {
    title: string;
    description?: string;
  };
}
