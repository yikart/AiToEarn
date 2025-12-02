/**
 * 发布参数类型定义
 */

/**
 * 发布类型
 */
export type PublishType = 'video' | 'image';

/**
 * 可见性类型
 */
export type VisibilityType = 'public' | 'private' | 'friends';

/**
 * 位置信息
 */
export interface LocationInfo {
  /** 位置ID */
  id: string;
  /** 位置名称 */
  name: string;
  /** 位置类型 */
  poiType?: number;
  /** 详细地址 */
  address?: string;
  /** 简短地址 */
  simpleAddress?: string;
  /** 纬度 */
  latitude?: number;
  /** 经度 */
  longitude?: number;
}

/**
 * @用户信息
 */
export interface MentionUserInfo {
  /** 用户ID */
  id: string;
  /** 用户昵称 */
  nickname: string;
}

/**
 * 发布参数
 */
export interface PublishParams {
  /** 发布类型 */
  type: PublishType;

  /** 标题 */
  title?: string;

  /** 描述/正文 */
  desc?: string;

  /** 视频文件或URL（发布视频时必需） */
  video?: File | string;

  /** 图片文件或URL数组（发布图文时必需） */
  images?: (File | string)[];

  /** 封面图片（视频发布时必需） */
  cover?: File | string;

  /** 话题标签 */
  topics?: string[];

  /** 位置信息 */
  location?: LocationInfo;

  /** 可见性 */
  visibility?: VisibilityType;

  /** @的用户 */
  mentionedUsers?: MentionUserInfo[];

  /** 定时发布时间戳（毫秒） */
  scheduledTime?: number;

  /** 平台特定配置 */
  platformConfig?: Record<string, any>;
}

/**
 * 参数验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors?: string[];
}
