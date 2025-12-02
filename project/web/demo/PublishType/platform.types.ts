/**
 * 平台相关类型定义
 */

import { PlatformType } from '../../../config/accountConfig';

/**
 * 平台配置接口
 */
export interface PlatformConfig {
  /** 平台类型 */
  type: PlatformType;
  /** Cookie字符串 */
  cookie: string;
  /** 平台特定的额外配置 */
  extra?: Record<string, any>;
}

/**
 * 平台能力
 */
export interface PlatformCapabilities {
  /** 支持视频发布 */
  supportsVideo: boolean;
  /** 支持图文发布 */
  supportsImages: boolean;
  /** 支持话题 */
  supportsTopics: boolean;
  /** 支持位置 */
  supportsLocation: boolean;
  /** 支持@用户 */
  supportsMention: boolean;
  /** 支持定时发布 */
  supportsSchedule: boolean;
  /** 支持可见性设置 */
  supportsVisibility: boolean;
}
