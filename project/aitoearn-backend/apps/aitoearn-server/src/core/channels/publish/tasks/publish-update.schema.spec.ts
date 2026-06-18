import { describe, expect, it } from 'vitest'
import { PublishUpdateDataSchema } from './publish-update.schema'

describe('publish update schema', () => {
  it('strips client-provided media metadata from update content input', () => {
    const result = PublishUpdateDataSchema.safeParse({
      content: {
        media: [{
          url: 'https://cdn.example.test/signed-video',
          metadata: { type: 'video' },
        }],
        cover: {
          url: 'https://cdn.example.test/signed-cover',
          metadata: { type: 'image' },
        },
      },
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content?.media?.[0]).not.toHaveProperty('metadata')
      expect(result.data.content?.cover).not.toHaveProperty('metadata')
    }
  })
})
