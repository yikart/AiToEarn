import { DraftGenerationMemoryContentType } from '@yikart/aitoearn-ai-shared'
import { AiLogChannel } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { config } from '../../config'
import { DraftGenerationPlannerService } from './draft-generation-planner.service'

const createOpenAIMock = vi.hoisted(() => vi.fn(() => ({
  chat: vi.fn((model: string) => ({ model, provider: 'openai' })),
})))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: createOpenAIMock,
}))

describe('draftGenerationPlannerService prompt rules', () => {
  const service = Object.create(DraftGenerationPlannerService.prototype) as unknown as {
    buildVideoPrompt: (input: Record<string, unknown>) => string
    buildImageTextPrompt: (input: Record<string, unknown>) => string
    buildMessages: (prompt: string, referenceImageUrls: string[]) => Array<{
      role: string
      content: Array<{ type: string, text?: string, image?: URL, mediaType?: string }>
    }>
    createPlannerModel: (modelConfig: { channel: AiLogChannel, name: string }) => unknown
  }

  it('captionPrompt 存在时，视频标题描述仍以视频主体为内容来源', () => {
    const prompt = service.buildVideoPrompt({
      userId: 'user-1',
      contentType: DraftGenerationMemoryContentType.Video,
      userPrompt: '为全聚德烤鸭店创建一个探店打卡内容，展示专业的探店体验',
      captionPrompt: '重要：标题字数不超过20个字符，描述字数不超过1000个字符，话题数量不超过5个，标题一定不要加表情',
      memoryItems: [],
      model: 'grok-imagine-video',
      duration: 10,
      aspectRatio: '9:16',
      platforms: ['xhs'],
    })

    expect(prompt).toContain('Use Video Prompt as the content source for title, description, topics, and videoPrompt')
    expect(prompt).toContain('Title, description, and topics must stay grounded in the concrete subject')
    expect(prompt).toContain('Avoid generic titles/descriptions when the Video Prompt contains a specific subject')
    expect(prompt).toContain('为全聚德烤鸭店创建一个探店打卡内容')
    expect(prompt).not.toContain('Do NOT use Video Prompt to create title, description, or topics')
  })

  it('captionPrompt 存在时，图文标题描述融合图片主体，但图片提示词不混入文案约束', () => {
    const prompt = service.buildImageTextPrompt({
      userId: 'user-1',
      contentType: DraftGenerationMemoryContentType.ImageText,
      userPrompt: '为全聚德烤鸭店创建三张小红书探店图文，突出烤鸭、门店环境和服务体验',
      captionPrompt: '重要：标题字数不超过20个字符，描述字数不超过1000个字符，话题数量不超过5个，标题一定不要加表情',
      memoryItems: [],
      imageModel: 'gpt-image-2',
      imageCount: 3,
      imageSize: '1K',
      aspectRatio: '3:4',
      platforms: ['xhs'],
    })

    expect(prompt).toContain('Use Image Prompt as the content source for title, description, topics, and imagePrompts')
    expect(prompt).toContain('Title, description, and topics must stay grounded in the concrete subject')
    expect(prompt).toContain('Avoid generic titles/descriptions when the Image Prompt contains a specific subject')
    expect(prompt).toContain('Do NOT use Caption Prompt to create, rewrite, translate, expand, or constrain imagePrompts')
    expect(prompt).toContain('为全聚德烤鸭店创建三张小红书探店图文')
    expect(prompt).not.toContain('Do NOT use Image Prompt to create title, description, or topics')
  })

  it('图文文案不复述媒体负向约束，图片提示词保留这些约束', () => {
    const prompt = service.buildImageTextPrompt({
      userId: 'user-1',
      contentType: DraftGenerationMemoryContentType.ImageText,
      userPrompt: '“首旅精彩生活节”宣传，不要生成莫名其妙的二维码，宣传海报形式，不要显示王府井集团logo，不要显示任何不确定的东西。只做宣传即可，图片上不要有未知信息，如：联系方式、二维码等。卡通风格，不要出现图片上的人物，自由创作卡通人物',
      captionPrompt: '重要：标题字数不超过20个字符，描述字数不超过1000个字符，话题数量不超过5个，标题一定不要加表情',
      memoryItems: [],
      imageModel: 'gpt-image-2',
      imageCount: 1,
      imageSize: '1K',
      aspectRatio: '3:4',
      platforms: ['xhs'],
    })

    expect(prompt).toContain('首旅精彩生活节')
    expect(prompt).toContain('Do NOT copy media-generation instructions, style directions, negative constraints, or uncertainty guards into title, description, or topics')
    expect(prompt).toContain('Title and description should promote the subject itself, not describe the generated image, poster, or style')
    expect(prompt).toContain('Preserve media-generation style, format, and negative constraints from the Image Prompt in imagePrompts')
  })

  it('视频文案不复述媒体负向约束，视频提示词保留这些约束', () => {
    const prompt = service.buildVideoPrompt({
      userId: 'user-1',
      contentType: DraftGenerationMemoryContentType.Video,
      userPrompt: '“首旅精彩生活节”宣传，不要生成莫名其妙的二维码，不要显示王府井集团logo，不要显示任何不确定的东西。只做宣传即可，不要有未知信息，如：联系方式、二维码等。卡通风格，不要出现参考图上的人物',
      captionPrompt: '重要：标题字数不超过20个字符，描述字数不超过1000个字符，话题数量不超过5个，标题一定不要加表情',
      memoryItems: [],
      model: 'grok-imagine-video',
      duration: 10,
      aspectRatio: '9:16',
      platforms: ['xhs'],
    })

    expect(prompt).toContain('首旅精彩生活节')
    expect(prompt).toContain('Do NOT copy media-generation instructions, style directions, negative constraints, or uncertainty guards into title, description, or topics')
    expect(prompt).toContain('Title and description should promote the subject itself, not describe the generated creative asset')
    expect(prompt).toContain('Preserve media-generation style, format, and negative constraints from the Video Prompt')
  })

  it('captionPrompt 为空时，继续从用户 prompt 生成社交媒体标题描述', () => {
    const prompt = service.buildVideoPrompt({
      userId: 'user-1',
      contentType: DraftGenerationMemoryContentType.Video,
      userPrompt: '为全聚德烤鸭店创建一个探店打卡内容',
      memoryItems: [],
      model: 'grok-imagine-video',
      platforms: ['xhs'],
    })

    expect(prompt).toContain('Generate title, description, and topics in the SAME language as the user prompt')
    expect(prompt).toContain('title: short post title in the SAME language as the user prompt')
    expect(prompt).toContain('为全聚德烤鸭店创建一个探店打卡内容')
  })

  it('planner 消息不再传入视频 file part，但 prompt 保留参考视频 URL', () => {
    const prompt = service.buildVideoPrompt({
      userId: 'user-1',
      contentType: DraftGenerationMemoryContentType.Video,
      userPrompt: '随意发挥',
      memoryItems: [],
      model: 'seedance-2-fast-beta',
      duration: 15,
      aspectRatio: '9:16',
      referenceImageUrls: ['https://assets.example.com/ref.png'],
      referenceVideoUrls: ['https://assets.example.com/ref.mp4'],
      platforms: ['xhs'],
    })

    const messages = service.buildMessages(prompt, ['https://assets.example.com/ref.png'])
    const content = messages[0].content

    expect(prompt).toContain('Reference Videos: https://assets.example.com/ref.mp4')
    expect(content).toEqual([
      { type: 'text', text: prompt },
      { type: 'image', image: new URL('https://assets.example.com/ref.png') },
    ])
    expect(content.some(part => part.type === 'file' || part.mediaType === 'video/mp4')).toBe(false)
  })

  it('deepseek planner 仍使用 OpenAI 兼容模型工厂', () => {
    createOpenAIMock.mockClear()

    const model = service.createPlannerModel({
      channel: AiLogChannel.DeepSeek,
      name: 'deepseek-v4-flash',
    })

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: config.ai.openai.apiKey,
      baseURL: config.ai.openai.baseUrl,
    })
    expect(model).toEqual({
      model: 'deepseek-v4-flash',
      provider: 'openai',
    })
  })
})
