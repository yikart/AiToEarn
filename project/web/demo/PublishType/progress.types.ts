/**
 * 进度事件类型定义
 */

/**
 * 发布阶段
 */
export type PublishStage =
  | 'download'
  | 'upload'
  | 'publish'
  | 'complete'
  | 'error';

/**
 * 进度事件
 */
export interface ProgressEvent {
  /** 当前阶段 */
  stage: PublishStage;

  /** 进度百分比 (0-100) */
  progress: number;

  /** 进度消息 */
  message?: string;

  /** 附加数据 */
  data?: any;

  /** 时间戳 */
  timestamp?: number;
}

/**
 * 下载进度事件
 */
export interface DownloadProgressEvent extends ProgressEvent {
  stage: 'download';
  data?: {
    /** 已下载字节数 */
    loaded: number;
    /** 总字节数 */
    total: number;
    /** 下载速度 (bytes/s) */
    speed?: number;
  };
}

/**
 * 上传进度事件
 */
export interface UploadProgressEvent extends ProgressEvent {
  stage: 'upload';
  data?: {
    /** 已上传字节数 */
    loaded: number;
    /** 总字节数 */
    total: number;
    /** 当前分片索引 */
    chunkIndex?: number;
    /** 总分片数 */
    totalChunks?: number;
  };
}

/**
 * 发布进度事件
 */
export interface PublishProgressEvent extends ProgressEvent {
  stage: 'publish';
  data?: {
    /** 发布步骤 */
    step: 'preparing' | 'signing' | 'submitting' | 'verifying';
  };
}

/**
 * 完成事件
 */
export interface CompleteEvent extends ProgressEvent {
  stage: 'complete';
  data?: {
    /** 作品ID */
    workId: string;
    /** 分享链接 */
    shareLink?: string;
  };
}

/**
 * 错误事件
 */
export interface ErrorEvent extends ProgressEvent {
  stage: 'error';
  data?: {
    /** 错误代码 */
    code?: string;
    /** 错误详情 */
    error: Error;
  };
}
