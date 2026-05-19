import { describe, expect, it } from 'vitest'
import { DraftGenerationService } from './draft-generation.service'

describe('draftGenerationService OpenAI image size resolution', () => {
  const service = Object.create(DraftGenerationService.prototype) as unknown as {
    resolveOpenAIImageSize: (aspectRatio?: string) => string
  }

  it('为 GPT Image 2 生成真实比例且符合 16 倍数的尺寸', () => {
    expect(service.resolveOpenAIImageSize('3:2')).toBe('1536x1024')
    expect(service.resolveOpenAIImageSize('2:3')).toBe('1024x1536')
    expect(service.resolveOpenAIImageSize('4:3')).toBe('1408x1056')
    expect(service.resolveOpenAIImageSize('3:4')).toBe('1056x1408')
    expect(service.resolveOpenAIImageSize('5:4')).toBe('1360x1088')
    expect(service.resolveOpenAIImageSize('4:5')).toBe('1088x1360')
    expect(service.resolveOpenAIImageSize('16:9')).toBe('1536x864')
    expect(service.resolveOpenAIImageSize('9:16')).toBe('864x1536')
  })

  it('保留默认竖图和方图标准尺寸', () => {
    expect(service.resolveOpenAIImageSize()).toBe('1024x1536')
    expect(service.resolveOpenAIImageSize('1:1')).toBe('1024x1024')
  })

  it('拒绝 GPT Image 2 不支持的比例范围', () => {
    expect(() => service.resolveOpenAIImageSize('4:1')).toThrow('between 1:3 and 3:1')
  })
})
