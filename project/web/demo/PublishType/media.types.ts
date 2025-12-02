/**
 * 媒体资源类型定义
 */

/**
 * 媒体类型
 */
export type MediaType = 'video' | 'image';

/**
 * 视频元信息
 */
export interface VideoMetadata {
  /** 时长（秒） */
  duration: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 旋转角度 */
  rotation?: number;
  /** 比特率 */
  bitrate?: number;
  /** 帧率 */
  frameRate?: number;
  /** 编码格式 */
  codec?: string;
  /** 文件大小（字节） */
  size?: number;
}

/**
 * 图片元信息
 */
export interface ImageMetadata {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 格式 */
  format: string;
  /** 文件大小（字节） */
  size?: number;
}

/**
 * 媒体源（可以是File对象或URL字符串）
 */
export type MediaSource = File | string;

/**
 * 文件分片信息
 */
export interface FileChunkInfo {
  /** 分片索引 */
  index: number;
  /** 分片起始位置 */
  start: number;
  /** 分片结束位置 */
  end: number;
  /** 分片大小 */
  size: number;
  /** 分片数据 */
  blob: Blob;
}

/**
 * 文件分片配置
 */
export interface ChunkConfig {
  /** 分片大小（字节），默认5MB */
  chunkSize: number;
  /** 总文件大小 */
  totalSize: number;
  /** 总分片数 */
  totalChunks: number;
}

/**
 * 上传结果
 */
export interface UploadResult {
  /** 远程文件ID */
  fileId: string;
  /** 预览URL */
  previewUrl?: string;
  /** 附加信息 */
  extra?: Record<string, any>;
}

/**
 * 视频上传结果
 */
export interface VideoUploadResult extends UploadResult {
  /** 视频ID */
  videoId?: string;
  /** 元数据 */
  metadata?: VideoMetadata;
}

/**
 * 图片上传结果
 */
export interface ImageUploadResult extends UploadResult {
  /** 元数据 */
  metadata?: ImageMetadata;
}
