/**
 * 去重评分模块类型定义
 */

/** 帧级评分结果 */
export interface FrameScoreResult {
  /** pHash 哈希值 (16 hex chars) */
  hash: string
  /** 与源库最高相似度 [0, 1] */
  similarity: number
  /** 比对过的源视频数量 */
  comparedCount: number
}

/** 音频指纹评分结果 */
export interface AudioScoreResult {
  /** 音频指纹特征长度 */
  fingerprintLength: number
  /** 与源库最高相似度 [0, 1] */
  similarity: number
  /** 比对过的源音频数量 */
  comparedCount: number
}

/** 字幕 embedding 评分结果 */
export interface SubtitleScoreResult {
  /** 字幕文本长度 (chars) */
  textLength: number
  /** embedding 向量维度 */
  embeddingDim: number
  /** 与源库最高语义相似度 [0, 1] */
  similarity: number
  /** 比对过的源字幕数量 */
  comparedCount: number
}

/** 综合去重评分 */
export interface DedupScore {
  /** 帧级得分 */
  frame: number
  /** 音频得分 */
  audio: number
  /** 字幕得分 */
  subtitle: number
  /** 加权综合分 [0, 1] */
  composite: number
  /** 是否触发二次混剪 (composite >= threshold) */
  needsRemix: boolean
}

/** 二次混剪参数 */
export interface RemixParams {
  /** 变速范围下限 */
  speedMin: number
  /** 变速范围上限 */
  speedMax: number
  /** 抽帧比例 (0-1, 5% = 0.05) */
  dropFrameRatio: number
  /** 噪点强度 (0-1) */
  noiseIntensity: number
}

/** 去重评分输入 */
export interface DedupScoringInput {
  /** 待评分视频 URL 或 VID */
  videoUrl: string
  /** 源库视频列表（用于比对） */
  sourceVideos: Array<{ url: string, audioUrl?: string, subtitles?: string }>
  /** 当前视频的 SRT 字幕文本（可选） */
  subtitleText?: string
  /** 综合分阈值，低于此值放行 */
  threshold?: number
  /** 权重配置 */
  weights?: { frame: number; audio: number; subtitle: number }
}

/** 去重评分输出 */
export interface DedupScoringOutput {
  score: DedupScore
  frameResult: FrameScoreResult
  audioResult: AudioScoreResult
  subtitleResult: SubtitleScoreResult
}

/** 混剪触发结果 */
export interface RemixTriggerResult {
  /** 是否需要二次混剪 */
  triggered: boolean
  /** 混剪后的视频 URL（若未触发则为原视频） */
  remixVideoUrl?: string
  /** 混剪参数 */
  remixParams: RemixParams
  /** 原始综合分 */
  originalScore: number
  taskId?: string
}
