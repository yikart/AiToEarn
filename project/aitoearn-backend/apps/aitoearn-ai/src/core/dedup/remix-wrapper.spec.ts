import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RemixWrapper } from './remix-wrapper'
import type { DedupScoringOutput, DedupScore, FrameScoreResult, AudioScoreResult, SubtitleScoreResult } from './dedup-types'
import type { VolcengineService } from '../ai/libs/volcengine'

describe('RemixWrapper', () => {
  let wrapper: RemixWrapper
  let mockVolcengineService: vi.Mocked<Pick<VolcengineService, 'submitDirectEditTaskAsync'>>

  beforeEach(() => {
    mockVolcengineService = {
      submitDirectEditTaskAsync: vi.fn().mockResolvedValue({ ReqId: 'test-task-id' }),
    } as unknown as vi.Mocked<Pick<VolcengineService, 'submitDirectEditTaskAsync'>>

    wrapper = new RemixWrapper(mockVolcengineService as unknown as VolcengineService)
  })

  describe('triggerRemix', () => {
    it('should NOT trigger remix when score < threshold', async () => {
      const output: DedupScoringOutput = {
        score: {
          frame: 0.1,
          audio: 0.1,
          subtitle: 0.1,
          composite: 0.1,
          needsRemix: false,
        } as DedupScore,
        frameResult: { hash: 'abc', similarity: 0.1, comparedCount: 1 } as FrameScoreResult,
        audioResult: { fingerprintLength: 64, similarity: 0.1, comparedCount: 1 } as AudioScoreResult,
        subtitleResult: { textLength: 10, embeddingDim: 1536, similarity: 0.1, comparedCount: 1 } as SubtitleScoreResult,
      }

      const result = await wrapper.triggerRemix(output)

      expect(result.triggered).toBe(false)
      expect(result.remixVideoUrl).toBeUndefined()
      expect(result.originalScore).toBe(0.1)
    })

    it('should trigger remix when score >= threshold', async () => {
      const output: DedupScoringOutput = {
        score: {
          frame: 0.9,
          audio: 0.8,
          subtitle: 0.85,
          composite: 0.85,
          needsRemix: true,
        } as DedupScore,
        frameResult: { hash: 'def', similarity: 0.9, comparedCount: 3 } as FrameScoreResult,
        audioResult: { fingerprintLength: 64, similarity: 0.8, comparedCount: 2 } as AudioScoreResult,
        subtitleResult: { textLength: 20, embeddingDim: 1536, similarity: 0.85, comparedCount: 2 } as SubtitleScoreResult,
      }

      const result = await wrapper.triggerRemix(output)

      expect(result.triggered).toBe(true)
      expect(result.originalScore).toBe(0.85)
      expect(result.remixParams.speedMin).toBe(0.95)
      expect(result.remixParams.speedMax).toBe(1.05)
      expect(result.remixParams.dropFrameRatio).toBe(0.05)
      expect(result.remixParams.noiseIntensity).toBe(0.02)
      expect(mockVolcengineService.submitDirectEditTaskAsync).toHaveBeenCalledOnce()
    })

    it('should use custom remix params when provided', async () => {
      const output: DedupScoringOutput = {
        score: {
          frame: 0.9,
          audio: 0.9,
          subtitle: 0.9,
          composite: 0.9,
          needsRemix: true,
        } as DedupScore,
        frameResult: { hash: 'xyz', similarity: 0.9, comparedCount: 1 } as FrameScoreResult,
        audioResult: { fingerprintLength: 64, similarity: 0.9, comparedCount: 1 } as AudioScoreResult,
        subtitleResult: { textLength: 15, embeddingDim: 1536, similarity: 0.9, comparedCount: 1 } as SubtitleScoreResult,
      }

      const result = await wrapper.triggerRemix(output, {
        speedMin: 0.9,
        speedMax: 1.1,
        dropFrameRatio: 0.1,
        noiseIntensity: 0.05,
      })

      expect(result.triggered).toBe(true)
      expect(result.remixParams.speedMin).toBe(0.9)
      expect(result.remixParams.speedMax).toBe(1.1)
      expect(result.remixParams.dropFrameRatio).toBe(0.1)
      expect(result.remixParams.noiseIntensity).toBe(0.05)
    })

    it('should have taskId in result when triggered', async () => {
      const output: DedupScoringOutput = {
        score: {
          frame: 0.9,
          audio: 0.9,
          subtitle: 0.9,
          composite: 0.9,
          needsRemix: true,
        } as DedupScore,
        frameResult: { hash: 'abc', similarity: 0.9, comparedCount: 1 } as FrameScoreResult,
        audioResult: { fingerprintLength: 64, similarity: 0.9, comparedCount: 1 } as AudioScoreResult,
        subtitleResult: { textLength: 10, embeddingDim: 1536, similarity: 0.9, comparedCount: 1 } as SubtitleScoreResult,
      }

      const result = await wrapper.triggerRemix(output)

      expect(result.triggered).toBe(true)
      expect(result.taskId).toBe('test-task-id')
    })
  })

  describe('without volcengine service', () => {
    it('should throw when remix triggered but volcengine service unavailable', async () => {
      const noVolcWrapper = new RemixWrapper()
      const output: DedupScoringOutput = {
        score: {
          frame: 0.9,
          audio: 0.9,
          subtitle: 0.9,
          composite: 0.9,
          needsRemix: true,
        } as DedupScore,
        frameResult: { hash: 'abc', similarity: 0.9, comparedCount: 1 } as FrameScoreResult,
        audioResult: { fingerprintLength: 64, similarity: 0.9, comparedCount: 1 } as AudioScoreResult,
        subtitleResult: { textLength: 10, embeddingDim: 1536, similarity: 0.9, comparedCount: 1 } as SubtitleScoreResult,
      }

      await expect(noVolcWrapper.triggerRemix(output)).rejects.toThrow('VolcengineService is required')
    })
  })
})
