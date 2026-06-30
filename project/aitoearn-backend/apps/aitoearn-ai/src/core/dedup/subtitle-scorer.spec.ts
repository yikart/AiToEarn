import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { SubtitleEmbedding } from './subtitle-scorer'

// Mock the OpenAI service to avoid mongoose import chain
vi.mock('../ai/libs/openai/openai.service', () => ({
  OpenaiService: vi.fn(),
}))

vi.mock('../ai/libs/openai/openai.config', () => ({
  OpenaiConfig: vi.fn(),
}))

// Now import after mocking
const { SubtitleScorer } = await import('./subtitle-scorer')

describe('SubtitleScorer', () => {
  let scorer: SubtitleScorer

  beforeEach(() => {
    // Without openaiService, SubtitleScorer falls back to deterministic embedding
    scorer = new SubtitleScorer()
  })

  describe('generateEmbedding', () => {
    it('should generate an embedding for a subtitle text', async () => {
      const result = await scorer.generateEmbedding('这是一段测试字幕')
      expect(result.textLength).toBeGreaterThan(0)
      expect(result.vector.length).toBe(1536)
    })

    it('should produce deterministic embeddings for the same text', async () => {
      const text = '相同的字幕文本'
      const emb1 = await scorer.generateEmbedding(text)
      const emb2 = await scorer.generateEmbedding(text)
      expect(emb1.vector).toEqual(emb2.vector)
    })

    it('should produce different embeddings for different texts', async () => {
      const emb1 = await scorer.generateEmbedding('字幕文本A')
      const emb2 = await scorer.generateEmbedding('字幕文本B')
      expect(emb1.vector).not.toEqual(emb2.vector)
    })
  })

  describe('score', () => {
    it('should return similarity 0 with no source subtitles', async () => {
      const result = await scorer.score('目标字幕', [])
      expect(result.similarity).toBe(0)
      expect(result.comparedCount).toBe(0)
    })

    it('should return similarity 1 for identical subtitles', async () => {
      const text = '完全相同的字幕内容'
      const result = await scorer.score(text, [text])
      expect(result.similarity).toBe(1)
      expect(result.comparedCount).toBe(1)
    })

    it('should score against multiple source subtitles', async () => {
      const result = await scorer.score('目标字幕', [
        '源字幕A',
        '源字幕B',
        '源字幕C',
      ])
      expect(result.comparedCount).toBe(3)
      expect(result.similarity).toBeGreaterThanOrEqual(0)
      expect(result.similarity).toBeLessThanOrEqual(1)
    })

    it('should return correct text length and embedding dimension', async () => {
      const text = '这是一段中等长度的测试字幕内容'
      const result = await scorer.score(text, ['源字幕1', '源字幕2'])
      expect(result.textLength).toBe(text.length)
      expect(result.embeddingDim).toBe(1536)
    })
  })

  describe('scoreWithCachedEmbeddings', () => {
    it('should return similarity 0 with no cached embeddings', async () => {
      const result = await scorer.scoreWithCachedEmbeddings('目标字幕', [])
      expect(result.similarity).toBe(0)
      expect(result.comparedCount).toBe(0)
    })

    it('should score against cached embeddings', async () => {
      const emb1 = await scorer.generateEmbedding('缓存字幕A')
      const emb2 = await scorer.generateEmbedding('缓存字幕B')

      const result = await scorer.scoreWithCachedEmbeddings(
        '目标字幕',
        [emb1, emb2],
      )

      expect(result.comparedCount).toBe(2)
      expect(result.similarity).toBeGreaterThanOrEqual(0)
      expect(result.similarity).toBeLessThanOrEqual(1)
    })

    it('should return similarity 1 for identical cached embeddings', async () => {
      const text = '完全相同的缓存字幕'
      const cached: SubtitleEmbedding = await scorer.generateEmbedding(text)
      const result = await scorer.scoreWithCachedEmbeddings(text, [cached])
      expect(result.similarity).toBe(1)
    })
  })
})
