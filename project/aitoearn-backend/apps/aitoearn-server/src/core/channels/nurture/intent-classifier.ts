import { Injectable, Logger } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import axios, { AxiosInstance } from 'axios'
import { AitoearnAiClientConfig } from '@yikart/aitoearn-ai-client'

// ─── 意图分类结果 ────────────────────────────────────────────

export enum IntentLevel {
  /** 高意向：明确询问价格、购买方式、联系方式 */
  HIGH = 'HIGH',
  /** 中意向：表达兴趣、了解更多、比较产品 */
  MEDIUM = 'MEDIUM',
  /** 无效/噪音：广告、 spam、无关内容 */
  INVALID = 'INVALID',
}

export interface IntentClassification {
  /** 意图等级 */
  level: IntentLevel
  /** 置信度 0-1 */
  confidence: number
  /** 分类理由 */
  reason: string
  /** 提取的关键实体（如价格、产品名） */
  entities?: Record<string, string>
}

// ─── Prompt 模板 ────────────────────────────────────────────

const CLASSIFICATION_PROMPT = `你是一个社交媒体评论意图分类器。请分析以下评论内容，判断评论者的购买意向等级。

评论者意图分为三个等级：
- HIGH（高意向）：明确询问价格、怎么买、在哪里买、有没有优惠、联系方式等
- MEDIUM（中意向）：表达兴趣、觉得不错、想了解更多、和其他产品比较等
- INVALID（无效）：广告推广、spam、辱骂、无关内容、纯表情等

请严格按以下 JSON 格式返回，不要包含任何其他内容：
{
  "level": "HIGH|MEDIUM|INVALID",
  "confidence": 0.0-1.0,
  "reason": "简短的分类理由",
  "entities": {"实体名": "实体值"}
}

评论内容：'''{{COMMENT}}'''`

// ─── 内置规则引擎（快速过滤，不调用 LLM） ─────────────────────

const HIGH_INTENT_KEYWORDS = [
  '多少钱', '价格', '怎么买', '哪里买', '购买', '链接', '下单',
  '优惠', '折扣', '促销', '联系方式', '电话', '私聊',
  '报价', '多少钱一个', '团购', '批发', '代理', '加盟',
  'how much', 'buy', 'link', 'price', 'discount', 'deal',
]

const INVALID_KEYWORDS = [
  '关注', '互粉', '点赞', '转发', '抽奖', '免费送', '加微信',
  '广告', '推广', '刷屏', '垃圾', '傻逼', '滚蛋', '呵呵',
  'follow', 'like', 'rt', 'spam', 'scam',
]

export function fastMatch(comment: string): IntentClassification | null {
  const lower = comment.toLowerCase()

  // 优先检查无效/Spam（即使包含高意向关键词也优先判定为无效）
  const invalidHits = INVALID_KEYWORDS.filter(kw => lower.includes(kw)).length
  if (invalidHits >= 1) {
    return { level: IntentLevel.INVALID, confidence: 0.85, reason: '无效/spam 关键词匹配' }
  }

  // 高意向关键词命中 ≥ 2 个 → 直接判定 HIGH
  const highHits = HIGH_INTENT_KEYWORDS.filter(kw => lower.includes(kw)).length
  if (highHits >= 2) {
    return { level: IntentLevel.HIGH, confidence: 0.95, reason: '多条高意向关键词匹配' }
  }
  if (highHits === 1) {
    return { level: IntentLevel.HIGH, confidence: 0.75, reason: '单条高意向关键词匹配' }
  }

  return null
}

// ─── LLM 意图分类器服务 ──────────────────────────────────────

@Injectable()
export class IntentClassifier {
  private readonly logger = new Logger(IntentClassifier.name)
  private readonly httpClient: AxiosInstance
  private readonly model: string

  constructor(private readonly aiConfig: AitoearnAiClientConfig) {
    this.httpClient = axios.create({
      baseURL: this.aiConfig.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.aiConfig.token}`,
      },
    })
    this.model = this.aiConfig.model ?? 'gpt-4o-mini'
  }

  /**
   * 对评论进行意图分类
   * 流程：先走内置规则快速过滤，无法确定时再调 LLM
   */
  async classify(comment: string): Promise<IntentClassification> {
    // Step 1: 快速规则匹配
    const fastResult = fastMatch(comment)
    if (fastResult) {
      return fastResult
    }

    // Step 2: 调用 LLM 做精细分类
    try {
      return await this.classifyWithLLM(comment)
    }
    catch (err) {
      this.logger.warn(`LLM 意图分类失败，降级为 MEDIUM: ${(err as Error).message}`)
      // 降级策略：LLM 不可用时，保守返回 MEDIUM
      return {
        level: IntentLevel.MEDIUM,
        confidence: 0.5,
        reason: 'LLM 调用失败，降级为中意向',
      }
    }
  }

  /** 批量分类 */
  async classifyBatch(comments: string[]): Promise<Map<string, IntentClassification>> {
    const results = new Map<string, IntentClassification>()
    for (const comment of comments) {
      results.set(comment, await this.classify(comment))
    }
    return results
  }

  private async classifyWithLLM(comment: string): Promise<IntentClassification> {
    const prompt = CLASSIFICATION_PROMPT.replace('{{COMMENT}}', comment)

    const response = await this.httpClient.post('/internal/ai/chat', {
      messages: [
        { role: 'system' as const, content: '你是一个专业的社交媒体评论意图分析助手。请严格按要求的 JSON 格式回复。' },
        { role: 'user' as const, content: prompt },
      ],
      model: this.model,
      temperature: 0,
      maxTokens: 500,
    })

    const data = response.data
    // 兼容 aitoearn-ai 的 CommonResponse 包装
    const content = data?.data?.choices?.[0]?.message?.content
      ?? data?.choices?.[0]?.message?.content
      ?? (data as any)?.content

    if (!content) {
      throw new AppException(ResponseCode.AiServiceUnavailable, 'LLM 意图分类返回空响应')
    }

    // 解析 JSON 响应
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new AppException(ResponseCode.AiServiceUnavailable, `LLM 返回非 JSON 格式: ${content.slice(0, 100)}`)
    }

    const parsed = JSON.parse(jsonMatch[0]) as IntentClassification

    // 校验字段
    if (!Object.values(IntentLevel).includes(parsed.level)) {
      parsed.level = IntentLevel.MEDIUM
    }
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0.5))

    return parsed
  }
}
