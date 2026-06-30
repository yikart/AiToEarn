import { describe, it, expect } from 'vitest'
import { AudioScorer } from './audio-scorer'
import { SpectrumFingerprint } from './audio-scorer'

describe('SpectrumFingerprint', () => {
  it('should generate deterministic fingerprints for the same URL', () => {
    const url = 'https://example.com/audio.mp3'
    const fp1 = SpectrumFingerprint.generate(url)
    const fp2 = SpectrumFingerprint.generate(url)

    expect(fp1.spectrum).toEqual(fp2.spectrum)
    expect(fp1.binCount).toBe(64)
  })

  it('should produce different fingerprints for different URLs', () => {
    const fp1 = SpectrumFingerprint.generate('https://example.com/audio1.mp3')
    const fp2 = SpectrumFingerprint.generate('https://example.com/audio2.mp3')

    expect(fp1.spectrum).not.toEqual(fp2.spectrum)
  })

  it('should normalize spectrum values to [0, 1]', () => {
    const fp = SpectrumFingerprint.generate('https://example.com/test.mp3')
    for (const v of fp.spectrum) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('should respect custom bin count', () => {
    const fp = SpectrumFingerprint.generate('https://example.com/test.mp3', 128)
    expect(fp.binCount).toBe(128)
    expect(fp.spectrum.length).toBe(128)
  })

  it('should compute cosine similarity of identical fingerprints as 1', () => {
    const fp = SpectrumFingerprint.generate('https://example.com/same.mp3')
    const sim = SpectrumFingerprint.cosineSimilarity(fp.spectrum, fp.spectrum)
    expect(sim).toBeCloseTo(1, 4)
  })

  it('should compute cosine similarity of different fingerprints < 1', () => {
    const fp1 = SpectrumFingerprint.generate('https://example.com/audio1.mp3')
    const fp2 = SpectrumFingerprint.generate('https://example.com/audio2.mp3')
    const sim = SpectrumFingerprint.cosineSimilarity(fp1.spectrum, fp2.spectrum)
    expect(sim).toBeLessThan(1)
  })

  it('should return 0 for empty arrays', () => {
    expect(SpectrumFingerprint.cosineSimilarity([], [])).toBe(0)
  })

  it('should return 0 for mismatched lengths', () => {
    const a = [1, 2, 3]
    const b = [1, 2]
    expect(SpectrumFingerprint.cosineSimilarity(a, b)).toBe(0)
  })
})

describe('AudioScorer', () => {
  let scorer: AudioScorer

  beforeEach(() => {
    scorer = new AudioScorer()
  })

  it('should fingerprint an audio URL', async () => {
    const fp = await scorer.fingerprint('https://example.com/audio.mp3')
    expect(fp.binCount).toBe(64)
    expect(fp.spectrum.length).toBe(64)
  })

  it('should return similarity 0 with no sources', async () => {
    const result = await scorer.score('https://example.com/target.mp3', [])
    expect(result.similarity).toBe(0)
    expect(result.comparedCount).toBe(0)
  })

  it('should return similarity 1 for identical URLs', async () => {
    const url = 'https://example.com/same-audio.mp3'
    const result = await scorer.score(url, [url])
    expect(result.similarity).toBe(1)
    expect(result.comparedCount).toBe(1)
  })

  it('should score against multiple source audios', async () => {
    const result = await scorer.score('https://example.com/target.mp3', [
      'https://example.com/src1.mp3',
      'https://example.com/src2.mp3',
    ])
    expect(result.comparedCount).toBe(2)
    expect(result.similarity).toBeGreaterThanOrEqual(0)
    expect(result.similarity).toBeLessThanOrEqual(1)
  })

  it('should score with cached fingerprints', async () => {
    const fp1 = await scorer.fingerprint('https://example.com/src1.mp3')
    const fp2 = await scorer.fingerprint('https://example.com/src2.mp3')

    const result = await scorer.scoreWithCachedFingerprints(
      'https://example.com/target.mp3',
      [fp1, fp2],
    )

    expect(result.comparedCount).toBe(2)
    expect(result.similarity).toBeGreaterThanOrEqual(0)
    expect(result.similarity).toBeLessThanOrEqual(1)
  })

  it('should return similarity 0 with no cached fingerprints', async () => {
    const result = await scorer.scoreWithCachedFingerprints(
      'https://example.com/target.mp3',
      [],
    )
    expect(result.similarity).toBe(0)
    expect(result.comparedCount).toBe(0)
  })

  it('should use custom bin count', async () => {
    const customScorer = new AudioScorer(128)
    const result = await customScorer.score('https://example.com/audio.mp3', [])
    expect(result.fingerprintLength).toBe(128)
  })
})
