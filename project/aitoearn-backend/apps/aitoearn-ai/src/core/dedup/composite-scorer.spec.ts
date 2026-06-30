import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Shared mock functions
const mockFrameScore = vi.fn()
const mockAudioScore = vi.fn()
const mockSubtitleScore = vi.fn()

class MockFrameScorer {
  score = (...args: unknown[]) => mockFrameScore(...args)
}

class MockAudioScorer {
  score = (...args: unknown[]) => mockAudioScore(...args)
}

class MockSubtitleScorer {
  score = (...args: unknown[]) => mockSubtitleScore(...args)
}

vi.mock('./frame-scorer', () => ({
  FrameScorer: MockFrameScorer,
}))

vi.mock('./audio-scorer', () => ({
  AudioScorer: MockAudioScorer,
}))

vi.mock('./subtitle-scorer', () => ({
  SubtitleScorer: MockSubtitleScorer,
}))

// Now import after mocks are set up
const { CompositeScorer } = await import('./composite-scorer')

describe('CompositeScorer', () => {
  let scorer: CompositeScorer
  let frameScorer: MockFrameScorer
  let audioScorer: MockAudioScorer
  let subtitleScorer: MockSubtitleScorer

  beforeEach(() => {
    vi.clearAllMocks()
    mockFrameScore.mockResolvedValue({ hash: 'abc123', similarity: 0.5, comparedCount: 2 })
    mockAudioScore.mockResolvedValue({ fingerprintLength: 64, similarity: 0.3, comparedCount: 1 })
    mockSubtitleScore.mockResolvedValue({ textLength: 10, embeddingDim: 1536, similarity: 0.4, comparedCount: 1 })

    frameScorer = new MockFrameScorer()
    audioScorer = new MockAudioScorer()
    subtitleScorer = new MockSubtitleScorer()

    scorer = new CompositeScorer(frameScorer, audioScorer, subtitleScorer)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('score', () => {
    it('should call frame scorer and compute composite with defaults', async () => {
      const result = await scorer.score({
        videoUrl: 'https://example.com/target.mp4',
        sourceVideos: [
          { url: 'https://example.com/src1.mp4' },
          { url: 'https://example.com/src2.mp4' },
        ],
        subtitleText: '测试字幕',
      })

      // Frame scorer called, audio/subtitle not called (no audioUrl/subtitles in sourceVideos)
      expect(mockFrameScore).toHaveBeenCalledTimes(1)
      expect(mockAudioScore).not.toHaveBeenCalled()
      expect(mockSubtitleScore).not.toHaveBeenCalled()

      // Only frame contributes: 0.5 * 0.4 = 0.2
      expect(result.score.composite).toBeCloseTo(0.2, 4)
      expect(result.score.needsRemix).toBe(false)
    })

    it('should trigger remix when all scorers return high scores', async () => {
      mockFrameScore.mockResolvedValue({ hash: 'xyz', similarity: 0.95, comparedCount: 3 })
      mockAudioScore.mockResolvedValue({ fingerprintLength: 64, similarity: 0.9, comparedCount: 2 })
      mockSubtitleScore.mockResolvedValue({ textLength: 20, embeddingDim: 1536, similarity: 0.85, comparedCount: 2 })

      const result = await scorer.score({
        videoUrl: 'https://example.com/target.mp4',
        sourceVideos: [
          { url: 'https://example.com/src.mp4', audioUrl: 'https://example.com/src-audio.mp3', subtitles: '相似字幕' },
        ],
        subtitleText: '相似字幕',
      })

      // composite = 0.95*0.4 + 0.9*0.3 + 0.85*0.3 = 0.38 + 0.27 + 0.255 = 0.905
      expect(result.score.composite).toBeCloseTo(0.905, 4)
      expect(result.score.needsRemix).toBe(true)
    })

    it('should use custom weights', async () => {
      mockFrameScore.mockResolvedValue({ hash: 'a', similarity: 0.8, comparedCount: 1 })
      mockAudioScore.mockResolvedValue({ fingerprintLength: 64, similarity: 0.6, comparedCount: 1 })
      mockSubtitleScore.mockResolvedValue({ textLength: 10, embeddingDim: 1536, similarity: 0.7, comparedCount: 1 })

      const result = await scorer.score({
        videoUrl: 'https://example.com/target.mp4',
        sourceVideos: [{ url: 'https://example.com/src.mp4', audioUrl: 'https://example.com/src-a.mp3', subtitles: '测试' }],
        subtitleText: '测试',
        weights: { frame: 0.5, audio: 0.3, subtitle: 0.2 },
      })

      // composite = 0.8*0.5 + 0.6*0.3 + 0.7*0.2 = 0.4 + 0.18 + 0.14 = 0.72
      expect(result.score.composite).toBeCloseTo(0.72, 4)
    })

    it('should return correct output structure', async () => {
      const result = await scorer.score({
        videoUrl: 'https://example.com/target.mp4',
        sourceVideos: [],
      })

      expect(result.score).toHaveProperty('frame')
      expect(result.score).toHaveProperty('audio')
      expect(result.score).toHaveProperty('subtitle')
      expect(result.score).toHaveProperty('composite')
      expect(result.score).toHaveProperty('needsRemix')
      expect(result.frameResult).toHaveProperty('hash')
    })

    it('should handle empty source videos', async () => {
      const result = await scorer.score({
        videoUrl: 'https://example.com/target.mp4',
        sourceVideos: [],
      })

      expect(result.score.frame).toBe(0.5)
      expect(result.score.audio).toBe(0)
      expect(result.score.subtitle).toBe(0)
    })
  })

  describe('getRemixParams', () => {
    it('should return default remix params', () => {
      const params = scorer.getRemixParams()
      expect(params.speedMin).toBe(0.95)
      expect(params.speedMax).toBe(1.05)
      expect(params.dropFrameRatio).toBe(0.05)
      expect(params.noiseIntensity).toBe(0.02)
    })
  })
})
