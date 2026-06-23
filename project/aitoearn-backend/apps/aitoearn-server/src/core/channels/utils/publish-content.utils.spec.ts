import { describe, expect, it } from 'vitest'
import { PublishContentMode } from '../platforms/platforms.interface'
import { PublishValidationCombination, PublishValidationField, PublishValidationIssueCode } from '../platforms/publish.schema'
import { validatePublishContent } from './publish-content.utils'

describe('validatePublishContent modes', () => {
  it('rejects unsupported text mode', () => {
    const issues = validatePublishContent(
      { title: 'title', body: 'body', media: [] },
      { modes: [PublishContentMode.Video] },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      params: expect.objectContaining({ mode: PublishContentMode.Text }),
    }))
  })

  it('rejects unsupported image-text mode', () => {
    const issues = validatePublishContent(
      { body: 'body', media: [{ url: 'https://assets.example.test/a.jpg' }] },
      { modes: [PublishContentMode.Video] },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      params: expect.objectContaining({ mode: PublishContentMode.ImageText }),
    }))
  })

  it('rejects unsupported video mode', () => {
    const issues = validatePublishContent(
      { body: 'body', media: [{ url: 'https://assets.example.test/a.mp4' }] },
      { modes: [PublishContentMode.ImageText] },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      params: expect.objectContaining({ mode: PublishContentMode.Video }),
    }))
  })

  it('allows declared content modes', () => {
    const limits = {
      modes: [PublishContentMode.Text, PublishContentMode.ImageText, PublishContentMode.Video],
    }

    expect(validatePublishContent({ body: 'body', media: [] }, limits)).toEqual([])
    expect(validatePublishContent({
      body: 'body',
      media: [],
      cover: { url: 'https://assets.example.test/cover.jpg' },
    }, limits)).toEqual([])
    expect(validatePublishContent({ body: 'body', media: [{ url: 'https://assets.example.test/a.jpg' }] }, limits)).toEqual([])
    expect(validatePublishContent({ body: 'body', media: [{ url: 'https://assets.example.test/a.mp4' }] }, limits)).toEqual([])
  })

  it('treats text with cover as image-text mode', () => {
    const issues = validatePublishContent(
      {
        body: 'body',
        media: [],
        cover: { url: 'https://assets.example.test/cover.jpg' },
      },
      { modes: [PublishContentMode.Text] },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedContentMode,
      params: expect.objectContaining({ mode: PublishContentMode.ImageText }),
    }))
  })

  it('keeps mixed image/video as invalid combination instead of unsupported mode', () => {
    const issues = validatePublishContent(
      {
        body: 'body',
        media: [
          { url: 'https://assets.example.test/a.jpg' },
          { url: 'https://assets.example.test/a.mp4' },
        ],
      },
      { modes: [PublishContentMode.ImageText, PublishContentMode.Video] },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.InvalidCombination,
      params: expect.objectContaining({ combination: PublishValidationCombination.ImageVideo }),
    }))
    expect(issues).not.toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedContentMode,
    }))
  })

  it('classifies media by URL path extension instead of query string substrings', () => {
    const issues = validatePublishContent(
      {
        body: 'body',
        media: [{ url: 'https://assets.example.test/image.jpg?format=mp4' }],
      },
      { modes: [PublishContentMode.ImageText] },
    )

    expect(issues).toEqual([])
  })

  it('classifies signed URL media by server metadata type before URL extension fallback', () => {
    const issues = validatePublishContent(
      {
        body: 'body',
        media: [{ url: 'https://assets.example.test/download?id=video-1', metadata: { type: 'video' } }],
      },
      { modes: [PublishContentMode.Video] },
    )

    expect(issues).toEqual([])
  })

  it('detects image and video combinations from server metadata type', () => {
    const issues = validatePublishContent(
      {
        body: 'body',
        media: [
          { url: 'https://assets.example.test/download?id=image-1', metadata: { type: 'image' } },
          { url: 'https://assets.example.test/download?id=video-1', metadata: { type: 'video' } },
        ],
      },
      { modes: [PublishContentMode.ImageText, PublishContentMode.Video] },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.InvalidCombination,
      params: expect.objectContaining({ combination: PublishValidationCombination.ImageVideo }),
    }))
    expect(issues).not.toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.UnsupportedContentMode,
    }))
  })

  it('accepts extensionless covers when server metadata classifies them as images', () => {
    const issues = validatePublishContent(
      {
        body: 'body',
        media: [],
        cover: {
          url: 'https://assets.example.test/download?id=cover-1',
          metadata: { type: 'image' },
        },
      },
      { modes: [PublishContentMode.ImageText] },
    )

    expect(issues).toEqual([])
  })

  it('rejects topics parsed from body when platform topic maxCount is exceeded', () => {
    const issues = validatePublishContent(
      {
        body: '#a #b #c #d #e #f',
        media: [],
      },
      { modes: [PublishContentMode.Text] },
      { supported: true, maxCount: 5 },
    )

    expect(issues).toContainEqual(expect.objectContaining({
      code: PublishValidationIssueCode.TooBig,
      path: ['content', 'topics'],
      params: expect.objectContaining({
        field: PublishValidationField.Topic,
        maximum: 5,
      }),
    }))
  })

  it('uses stripped body length for platforms with native topic fields', () => {
    expect(validatePublishContent(
      {
        body: '正文 #很长很长的话题',
        media: [],
      },
      { modes: [PublishContentMode.Text], maxBodyLength: 2 },
      { supported: true, nativeField: true },
    )).toEqual([])

    expect(validatePublishContent(
      {
        title: '标题',
        body: '#话题',
        media: [],
      },
      { modes: [PublishContentMode.Text], maxTotalTextLength: 2 },
      { supported: true, nativeField: true },
    )).toEqual([])
  })
})
