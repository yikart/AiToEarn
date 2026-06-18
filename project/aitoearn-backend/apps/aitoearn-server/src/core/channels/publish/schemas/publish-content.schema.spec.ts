import { describe, expect, it } from 'vitest'
import { PublishContentInputSchema } from './publish-content.schema'

describe('publish content URL schema', () => {
  it('requires http media and cover URLs', () => {
    expect(PublishContentInputSchema.safeParse({
      media: [{ url: 'https://cdn.example.test/video.mp4' }],
      cover: { url: 'http://cdn.example.test/cover.jpg' },
    }).success).toBe(true)

    expect(PublishContentInputSchema.safeParse({
      media: [{ url: 'ftp://cdn.example.test/video.mp4' }],
    }).success).toBe(false)
  })

  it('accepts media adaptation options on media and cover objects', () => {
    const result = PublishContentInputSchema.safeParse({
      media: [{
        url: 'https://cdn.example.test/image.png',
        options: { adaptation: { imageFormat: 'auto' } },
      }],
      cover: {
        url: 'https://cdn.example.test/cover.png',
        options: { adaptation: { imageFormat: 'jpeg' } },
      },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.media[0].options?.adaptation?.imageFormat).toBe('auto')
      expect(result.data.cover?.options?.adaptation?.imageFormat).toBe('jpeg')
    }
  })

  it('strips client-provided media metadata from publish content input', () => {
    const result = PublishContentInputSchema.safeParse({
      media: [{
        url: 'https://cdn.example.test/signed-video',
        metadata: { type: 'video' },
      }],
      cover: {
        url: 'https://cdn.example.test/signed-cover',
        metadata: { type: 'image' },
      },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.media[0]).not.toHaveProperty('metadata')
      expect(result.data.cover).not.toHaveProperty('metadata')
    }
  })
})
