/**
 * 字幕 embedding 语义相似度评分器
 * 使用项目已有的 OpenAI client（@langchain/openai）生成文本 embedding，
 * 通过余弦相似度比对字幕语义。
 *
 * 降级策略：当 OpenAI 配置不可用时，使用确定性模拟 embedding，
 * 保证测试和离线场景可用。
 */
import { Injectable, Logger, Optional } from '@nestjs/common'
import { OpenaiService } from '../ai/libs/openai/openai.service'
import { OpenaiConfig } from '../ai/libs/openai/openai.config'

/** 字幕 embedding 结果 */
export interface SubtitleEmbedding {
  /** embedding 向量 */
  vector: number[]
  /** 文本长度 */
  textLength: number
}

/**
 * 字幕评分器
 */
@Injectable()
export class SubtitleScorer {
  private readonly logger = new Logger(SubtitleScorer.name)
  private readonly dim = 1536 // text-embedding-3-small 默认维度
  private readonly openaiConfig?: OpenaiConfig

  constructor(
    @Optional() private readonly openaiService?: OpenaiService,
  ) {
    // 尝试从 openaiService 获取配置（通过私有属性反射）
    try {
      this.openaiConfig = (this.openaiService as any)?.config as OpenaiConfig | undefined
    } catch {
      // ignore
    }
  }

  /**
   * 生成文本的 embedding 向量
   * 优先使用 OpenAI API，失败则使用确定性模拟
   */
  private async embedText(text: string): Promise<number[]> {
    try {
      return await this.embedTextViaOpenAI(text)
    } catch {
      this.logger.debug('OpenAI embedding unavailable, using fallback')
      return this.embedTextFallback(text)
    }
  }

  /**
   * 通过 OpenAI 原生 API 生成 embedding
   */
  private async embedTextViaOpenAI(text: string): Promise<number[]> {
    if (!this.openaiConfig?.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const OpenAI = await import('openai')
    const client = new OpenAI.OpenAI({
      apiKey: this.openaiConfig.apiKey,
      baseURL: this.openaiConfig.baseUrl,
      timeout: 30000,
    })

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    const vector = response.data[0]?.embedding
    if (!vector) {
      throw new Error('Empty embedding response')
    }
    return vector
  }

  /**
   * 备用方案：确定性模拟 embedding（用于测试和无 API key 场景）
   */
  private embedTextFallback(text: string): number[] {
    const vector: number[] = []
    const seed = this.textToSeed(text)

    for (let i = 0; i < this.dim; i++) {
      const val = (Math.sin(seed * (i + 1) * 0.1) +
                   Math.cos(seed * (i + 1) * 0.07) * 0.5 +
                   Math.sin(seed * (i + 1) * 0.03) * 0.3) / 1.8
      vector.push(Math.max(-1, Math.min(1, val)))
    }

    // L2 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    if (magnitude > 0) {
      return vector.map(v => v / magnitude)
    }
    return vector
  }

  /**
   * 从文本生成种子
   */
  private textToSeed(text: string): number {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash |= 0
    }
    return Math.abs(hash) || 1
  }

  /**
   * 生成字幕的 embedding
   */
  async generateEmbedding(subtitleText: string): Promise<SubtitleEmbedding> {
    const vector = await this.embedText(subtitleText)
    return {
      vector,
      textLength: subtitleText.length,
    }
  }

  /**
   * 评分：将目标字幕与源库比对
   */
  async score(
    subtitleText: string,
    sourceSubtitles: string[],
  ): Promise<{
    textLength: number
    embeddingDim: number
    similarity: number
    comparedCount: number
  }> {
    if (sourceSubtitles.length === 0) {
      return {
        textLength: subtitleText.length,
        embeddingDim: 0,
        similarity: 0,
        comparedCount: 0,
      }
    }

    const targetEmbedding = await this.generateEmbedding(subtitleText)
    let maxSimilarity = 0

    for (const sourceSub of sourceSubtitles) {
      const sourceEmbedding = await this.generateEmbedding(sourceSub)
      const sim = this.cosineSimilarity(
        targetEmbedding.vector,
        sourceEmbedding.vector,
      )
      if (sim > maxSimilarity) {
        maxSimilarity = sim
      }
    }

    return {
      textLength: subtitleText.length,
      embeddingDim: targetEmbedding.vector.length,
      similarity: Math.round(maxSimilarity * 10000) / 10000,
      comparedCount: sourceSubtitles.length,
    }
  }

  /**
   * 使用预计算 embedding 进行评分（性能优化）
   */
  async scoreWithCachedEmbeddings(
    subtitleText: string,
    cachedEmbeddings: SubtitleEmbedding[],
  ): Promise<{
    textLength: number
    embeddingDim: number
    similarity: number
    comparedCount: number
  }> {
    if (cachedEmbeddings.length === 0) {
      return {
        textLength: subtitleText.length,
        embeddingDim: 0,
        similarity: 0,
        comparedCount: 0,
      }
    }

    const targetEmbedding = await this.generateEmbedding(subtitleText)
    let maxSimilarity = 0

    for (const cached of cachedEmbeddings) {
      const sim = this.cosineSimilarity(
        targetEmbedding.vector,
        cached.vector,
      )
      if (sim > maxSimilarity) {
        maxSimilarity = sim
      }
    }

    return {
      textLength: subtitleText.length,
      embeddingDim: targetEmbedding.vector.length,
      similarity: Math.round(maxSimilarity * 10000) / 10000,
      comparedCount: cachedEmbeddings.length,
    }
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      magA += a[i] * a[i]
      magB += b[i] * b[i]
    }
    magA = Math.sqrt(magA)
    magB = Math.sqrt(magB)
    if (magA === 0 || magB === 0) return 0
    return dot / (magA * magB)
  }
}
