/**
 * Web与插件通信的类型定义
 * 定义所有消息协议、请求/响应接口
 */

import type {
  PublishParams,
  PublishResult,
  ProgressEvent,
} from '../coreLogic/publish/types';
import type { PlatAccountInfo } from '../coreLogic/login/plats/plat.type';
import { PlatformType } from '../config/accountConfig';

/**
 * 导出平台类型枚举（统一使用）
 */
export { PlatformType };

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 登录请求 */
  LOGIN_REQUEST = 'LOGIN_REQUEST',
  /** 登录响应 */
  LOGIN_RESPONSE = 'LOGIN_RESPONSE',
  /** 发布请求 */
  PUBLISH_REQUEST = 'PUBLISH_REQUEST',
  /** 发布进度更新 */
  PUBLISH_PROGRESS = 'PUBLISH_PROGRESS',
  /** 发布完成 */
  PUBLISH_COMPLETE = 'PUBLISH_COMPLETE',
  /** 发布错误 */
  PUBLISH_ERROR = 'PUBLISH_ERROR',
}

/**
 * 基础消息接口
 */
export interface BaseMessage {
  /** 消息来源标识 */
  source: string;
  /** 消息类型 */
  type: MessageType;
  /** 请求ID，用于关联请求和响应 */
  requestId: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequestPayload {
  /** 平台类型 */
  platform: PlatformType;
}

/**
 * 登录请求消息
 */
export interface LoginRequestMessage extends BaseMessage {
  type: MessageType.LOGIN_REQUEST;
  payload: LoginRequestPayload;
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  /** 是否成功 */
  success: boolean;
  /** 账号信息（成功时返回） */
  data?: PlatAccountInfo;
  /** 错误信息（失败时返回） */
  error?: string;
}

/**
 * 登录响应消息
 */
export interface LoginResponseMessage extends BaseMessage {
  type: MessageType.LOGIN_RESPONSE;
  result: LoginResponseData;
}

/**
 * 发布请求参数（扩展PublishParams，支持序列化的File）
 */
export interface PublishRequestPayload extends PublishParams {
  /** 平台类型 */
  platform: PlatformType;
}

/**
 * 发布请求消息
 */
export interface PublishRequestMessage extends BaseMessage {
  type: MessageType.PUBLISH_REQUEST;
  payload: PublishRequestPayload;
}

/**
 * 发布进度消息
 */
export interface PublishProgressMessage extends BaseMessage {
  type: MessageType.PUBLISH_PROGRESS;
  data: ProgressEvent;
}

/**
 * 发布完成消息
 */
export interface PublishCompleteMessage extends BaseMessage {
  type: MessageType.PUBLISH_COMPLETE;
  data: PublishResult;
}

/**
 * 发布错误消息
 */
export interface PublishErrorMessage extends BaseMessage {
  type: MessageType.PUBLISH_ERROR;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * 所有消息类型的联合类型
 */
export type WebMessage =
  | LoginRequestMessage
  | LoginResponseMessage
  | PublishRequestMessage
  | PublishProgressMessage
  | PublishCompleteMessage
  | PublishErrorMessage;

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (event: ProgressEvent) => void;

/**
 * Web API接口定义
 */
export interface AIToEarnPluginAPI {
  /**
   * 登录到指定平台
   * @param platform 平台类型
   * @returns Promise<账号信息>
   */
  login(platform: PlatformType): Promise<PlatAccountInfo>;

  /**
   * 发布内容到指定平台
   * @param params 发布参数
   * @param onProgress 进度回调函数
   * @returns Promise<发布结果>
   */
  publish(
    params: PublishRequestPayload,
    onProgress?: ProgressCallback,
  ): Promise<PublishResult>;
}

/**
 * 扩展Window接口，添加AIToEarnPlugin
 */
declare global {
  interface Window {
    AIToEarnPlugin?: AIToEarnPluginAPI;
  }
}
