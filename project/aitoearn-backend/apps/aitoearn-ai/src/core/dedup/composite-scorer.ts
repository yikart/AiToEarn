/**
 * 综合去重评分器
 * 融合帧级、音频、字幕三个子评分器，输出加权综合分
 * 低于阈值放行，高于阈值触发二次混剪
 */
import { Injectable, Logger } from '@nestjs/common'
import {
  DedupScore,
  RemixParams,
} from './dedup-types'
import { FrameScorer } from './frame-scorer'
import { AudioScorer } from './audio-scorer'
import { SubtitleScorer } from './subtitle-scorer'
import type {
  DedupScoringInput,
  DedupScoringOutput,
  FrameScoreResult,
  AudioScoreResult,
  SubtitleScoreResult,
} from './dedup-types'

/** 默认权重 */
const DEFAULT_WEIGHTS = {
  frame: 0.4,
  audio: 0.3,
  subtitle: 0.3,
}

/** 默认阈值 */
const DEFAULT_THRESHOLD = 0.7

/** 默认混剪参数 */
const DEFAULT_REMIX_PARAMS: RemixParams = {
  speedMin: 0.95,
  speedMax: 1.05,
  dropFrameRatio: 0.05,
  noiseIntensity: 0.02,
}

@Injectable()
export class CompositeScorer {
  private readonly logger = new Logger(CompositeScorer.name)

  constructor(
    private readonly frameScorer: FrameScorer,
    private readonly audioScorer: AudioScorer,
    private readonly subtitleScorer: SubtitleScorer,
  ) {}

  /**
   * 执行完整去重评分流程
   */
  async score(input: DedupScoringInput): Promise<DedupScoringOutput> {
    const weights = input.weights ?? DEFAULT_WEIGHTS
    const threshold = input.threshold ?? DEFAULT_THRESHOLD

    // 1. 帧级评分
    const sourceVideoUrls = input.sourceVideos.map(v => v.url)
    const frameResult = await this.frameScorer.score(
      input.videoUrl,
      sourceVideoUrls,
    )

    // 2. 音频评分
    const sourceAudioUrls = input.sourceVideos
      .map(v => v.audioUrl)
      .filter(Boolean) as string[]

    const audioResult = sourceAudioUrls.length > 0
      ? await this.audioScorer.score(input.videoUrl, sourceAudioUrls)
      : { fingerprintLength: 0, similarity: 0, comparedCount: 0 }

    // 3. 字幕评分
    const sourceSubtitleTexts = input.sourceVideos
      .map(v => v.subtitles)
      .filter(Boolean) as string[]

    const subtitleResult = input.subtitleText && sourceSubtitleTexts.length > 0
      ? await this.subtitleScorer.score(
          input.subtitleText,
          sourceSubtitleTexts,
        )
      : { textLength: 0, embeddingDim: 0, similarity: 0, comparedCount: 0 }

    // 4. 计算综合分
    const score = this.computeCompositeScore(
      frameResult.similarity,
      audioResult.similarity,
      subtitleResult.similarity,
      weights,
    )

    this.logger.debug({
      frame: frameResult.similarity,
      audio: audioResult.similarity,
      subtitle: subtitleResult.similarity,
      composite: score.composite,
      needsRemix: score.needsRemix,
    }, 'Dedup scoring complete')

    return {
      score,
      frameResult,
      audioResult,
      subtitleResult,
    }
  }

  /**
   * 计算加权综合分
   */
  private computeCompositeScore(
    frameSim: number,
    audioSim: number,
    subtitleSim: number,
    weights: { frame: number; audio: number; subtitle: number },
  ): DedupScore {
    // 归一化权重
    const totalWeight = weights.frame + weights.audio + weights.subtitle
    const wFrame = weights.frame / totalWeight
    const wAudio = weights.audio / totalWeight
    const wSubtitle = weights.subtitle / totalWeight

    const composite =
      frameSim * wFrame +
      audioSim * wAudio +
      subtitleSim * wSubtitle

    return {
      frame: frameSim,
      audio: audioSim,
      subtitle: subtitleSim,
      composite: Math.round(composite * 10000) / 10000,
      needsRemix: composite >= DEFAULT_THRESHOLD,
    }
  }

  /**
   * 获取默认混剪参数
   */
  getRemixParams(): RemixParams {
    return { ...DEFAULT_REMIX_PARAMS }
  }
}
