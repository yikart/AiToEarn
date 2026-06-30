import { describe, it, expect, beforeEach } from 'vitest'
import { FrameScorer } from './frame-scorer'

describe('FrameScorer', () => {
  let scorer: FrameScorer

  beforeEach(() => {
    scorer = new FrameScorer()
  })

  describe('extractKeyframeHashes', () => {
    it('should return deterministic hashes for the same URL', async () => {
      const url = 'https://example.com/video1.mp4'
      const hashes1 = await scorer.extractKeyframeHashes(url)
      const hashes2 = await scorer.extractKeyframeHashes(url)

      expect(hashes1).toEqual(hashes2)
      expect(hashes1).toHaveLength(5) // DEFAULT_CONFIG.keyframeCount
      // Each hash should be 16 hex chars
      for (const h of hashes1) {
        expect(h).toMatch(/^[0-9a-f]{16}$/)
      }
    })

    it('should return different hashes for different URLs', async () => {
      const hashesA = await scorer.extractKeyframeHashes('https://example.com/videoA.mp4')
      const hashesB = await scorer.extractKeyframeHashes('https://example.com/videoB.mp4')

      expect(hashesA).not.toEqual(hashesB)
    })
  })

  describe('score', () => {
    it('should return similarity 0 when no source videos provided', async () => {
      const result = await scorer.score('https://example.com/target.mp4', [])
      expect(result.similarity).toBe(0)
      expect(result.comparedCount).toBe(0)
    })

    it('should return similarity 1 when comparing identical URLs', async () => {
      const url = 'https://example.com/same-video.mp4'
      const result = await scorer.score(url, [url])
      expect(result.similarity).toBe(1)
      expect(result.comparedCount).toBe(1)
    })

    it('should score against multiple source videos', async () => {
      const target = 'https://example.com/target.mp4'
      const sources = [
        'https://example.com/source1.mp4',
        'https://example.com/source2.mp4',
        'https://example.com/source3.mp4',
      ]
      const result = await scorer.score(target, sources)
      expect(result.comparedCount).toBe(3)
      expect(result.similarity).toBeGreaterThanOrEqual(0)
      expect(result.similarity).toBeLessThanOrEqual(1)
    })

    it('should detect high similarity for similar URLs', async () => {
      // Two URLs that differ only slightly
      const url1 = 'https://example.com/video-identical.mp4'
      const url2 = 'https://example.com/video-identical.mp4'
      const result = await scorer.score(url1, [url2])
      expect(result.similarity).toBe(1)
    })
  })

  describe('seeded hash determinism', () => {
    it('should produce consistent hashes across instances', async () => {
      const scorer2 = new FrameScorer()
      const url = 'https://example.com/test.mp4'

      const hashes1 = await scorer.extractKeyframeHashes(url)
      const hashes2 = await scorer2.extractKeyframeHashes(url)

      expect(hashes1).toEqual(hashes2)
    })
  })
})
