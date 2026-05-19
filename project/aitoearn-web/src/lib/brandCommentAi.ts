import { aiChatStream } from '@/api/ai'

export interface BrandCommentGeneratedComment {
  content: string
  score: number
  reason: string
}

export interface BrandCommentWorkDetails {
  title: string
  description: string
}

export const SYSTEM_PROMPT_GENERATE = `你是一位专业的社交媒体评论生成助手。基于用户提供的作品详情和评论要求，生成自然、真实、符合场景的评论。

严格要求：
1. 仅输出 JSON，不要任何前后缀、解释或 markdown 代码块
2. 输出格式：{"comments":[{"content":"评论正文","score":4,"reason":"评分说明"}]}
3. content 字段只包含评论正文本身，不含引号、编号、emoji 前缀
4. score 为 1-5 的整数，代表评论的自然度（是否像真人写的）
5. reason 简短说明评分理由（不超过 20 字）
6. 根据 count 字段生成对应数量的评论
7. 评论之间应有风格差异（避免重复）`

export const SYSTEM_PROMPT_OPTIMIZE = `你是一位社交媒体评论提示词优化专家。

背景：用户在创建品牌评论任务时，需要编写一段「评论提示词」来指导 AI 按特定风格生成评论。
你的任务是根据当前提示词和生成效果，帮用户写出更好的提示词。

严格要求：
1. 仅输出 JSON，格式：{"optimizedPrompt":"...","reason":"..."}
2. optimizedPrompt 为改进后的完整评论提示词（用户可直接复制使用）
3. 优化方向：让评论更自然、更有针对性、风格更明确、避免模板化
4. 保持用户原有的风格意图，不要偏离用户想要的评论方向
5. reason 为简短说明（不超过 50 字），解释改进了什么`

export function extractBrandCommentTopics(description: string): string[] {
  const matches = description.match(/#([^\s#]+)/g)
  if (!matches)
    return []
  return [...new Set(matches.map(match => match.slice(1)))]
}

function parseAiJson<T>(raw: string): T {
  let text = raw.trim()

  if (text.startsWith('```') && text.endsWith('```')) {
    const firstLineBreakIndex = text.indexOf('\n')
    const closingFenceIndex = text.lastIndexOf('```')

    if (firstLineBreakIndex !== -1 && closingFenceIndex > firstLineBreakIndex) {
      text = text.slice(firstLineBreakIndex + 1, closingFenceIndex).trim()
    }
  }

  return JSON.parse(text) as T
}

export async function generateBrandCommentSamples(params: {
  prompt: string
  model?: string
  sampleCount: number
  workDetails: BrandCommentWorkDetails
}) {
  const topics = extractBrandCommentTopics(params.workDetails.description)

  const response = await aiChatStream({
    model: params.model || undefined,
    temperature: 0.8,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_GENERATE },
      {
        role: 'user',
        content: JSON.stringify({
          workDetails: {
            title: params.workDetails.title,
            description: params.workDetails.description,
            topics,
          },
          commentPrompt: params.prompt,
          count: params.sampleCount,
        }),
      },
    ],
  })

  if (!response.ok)
    throw new Error(`HTTP ${response.status}`)

  const json = await response.json()
  if (json.code !== 0 || !json.data?.content) {
    throw new Error(json.message || 'AI response failed')
  }

  const parsed = parseAiJson<{ comments: BrandCommentGeneratedComment[] }>(json.data.content)
  if (!Array.isArray(parsed.comments) || parsed.comments.length === 0) {
    throw new Error('Invalid AI response format')
  }

  return parsed.comments.slice(0, params.sampleCount)
}

export async function optimizeBrandCommentPrompt(params: {
  currentPrompt: string
  generatedSamples: string[]
  model?: string
  workDetails: BrandCommentWorkDetails
}) {
  const topics = extractBrandCommentTopics(params.workDetails.description)

  const response = await aiChatStream({
    model: params.model || undefined,
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_OPTIMIZE },
      {
        role: 'user',
        content: JSON.stringify({
          currentPrompt: params.currentPrompt,
          generatedSamples: params.generatedSamples,
          workDetails: {
            title: params.workDetails.title,
            description: params.workDetails.description,
            topics,
          },
        }),
      },
    ],
  })

  if (!response.ok)
    throw new Error(`HTTP ${response.status}`)

  const json = await response.json()
  if (json.code !== 0 || !json.data?.content) {
    throw new Error(json.message || 'AI response failed')
  }

  return parseAiJson<{ optimizedPrompt: string, reason: string }>(json.data.content)
}
