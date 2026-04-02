import { aitoearnAuthConfigSchema } from '@yikart/aitoearn-auth'
import { aitoearnServerClientConfigSchema } from '@yikart/aitoearn-server-client'
import { assetsConfigSchema } from '@yikart/assets'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { AiLogChannel, mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import z from 'zod'
import { geminiConfigSchema } from './core/ai/libs/gemini'
import { grokConfigSchema } from './core/ai/libs/grok'
import { openaiConfigSchema } from './core/ai/libs/openai'
import { volcengineConfigSchema } from './core/ai/libs/volcengine'

const chatPricingModalitySchema = z.object({
  text: z.string(),
  image: z.string().optional(),
  video: z.string().optional(),
  audio: z.string().optional(),
}).strict()

const chatPricingTierSchema = z.object({
  maxInputTokens: z.number().int().positive().optional(),
  input: chatPricingModalitySchema,
  output: chatPricingModalitySchema,
}).strict()

const chatTieredPricingSchema = z.object({
  tiers: z.array(chatPricingTierSchema).min(1),
}).strict().superRefine((pricing, ctx) => {
  const { tiers } = pricing
  const lastIndex = tiers.length - 1

  for (let i = 0; i < tiers.length; i++) {
    const current = tiers[i]
    const prev = i > 0 ? tiers[i - 1] : undefined

    if (i !== lastIndex && current.maxInputTokens == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['tiers', i, 'maxInputTokens'],
        message: 'Non-final tiers must define maxInputTokens',
      })
    }

    if (!prev) {
      continue
    }

    if (prev.maxInputTokens == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['tiers', i - 1, 'maxInputTokens'],
        message: 'Only the last tier can omit maxInputTokens',
      })
      continue
    }

    if (current.maxInputTokens != null && current.maxInputTokens <= prev.maxInputTokens) {
      ctx.addIssue({
        code: 'custom',
        path: ['tiers', i, 'maxInputTokens'],
        message: 'Tier maxInputTokens must be strictly increasing',
      })
    }
  }
})

const chatFlatPricingSchema = z.object({
  price: z.string(),
}).strict()

export const chatPricingSchema = z.union([chatFlatPricingSchema, chatTieredPricingSchema])

export const aiModelsConfigSchema = z.object({
  chat: z.array(z.object({
    name: z.string(),
    description: z.string(),
    summary: z.string().optional(),
    logo: z.string().optional(),
    tags: z.string().array().default([]),
    mainTag: z.string().optional(),
    inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    pricing: chatPricingSchema,
  })),
  image: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.string().array().default([]),
      mainTag: z.string().optional(),
      sizes: z.array(z.string()),
      qualities: z.array(z.string()),
      styles: z.array(z.string()),
      pricing: z.string(),
    })),
    edit: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.string().array().default([]),
      mainTag: z.string().optional(),
      sizes: z.array(z.string()),
      pricing: z.string(),
      maxInputImages: z.number(),
    })),
  }),
  video: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.array(z.object({ 'en-US': z.string(), 'zh-CN': z.string() })).default([]),
      mainTag: z.string().optional(),
      channel: z.enum(AiLogChannel),
      modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video', 'multi-image2video', 'video2video'])),
      resolutions: z.array(z.string()),
      durations: z.array(z.number()),
      maxInputImages: z.number().int().min(0),
      aspectRatios: z.array(z.string()),
      defaults: z.object({
        resolution: z.string().optional(),
        aspectRatio: z.string().optional(),
        duration: z.number().optional(),
      }),
      pricing: z.object({
        resolution: z.string().optional(),
        aspectRatio: z.string().optional(),
        mode: z.string().optional(),
        duration: z.number().optional(),
        price: z.number(),
      }).array(),
    })),
  }),
})

export const aideoPricingConfigSchema = z.object({
  vCreative: z.object({
    basePrice: z.number().describe('视频风格转换基础价格（元/分钟，720P）'),
  }),
  vision: z.object({
    basePrice: z.number().describe('视频理解基础价格（元/分钟）'),
  }),
  highlight: z.object({
    basePrice: z.number().describe('高光智剪基础价格（元/分钟）'),
  }),
  aiTranslation: z.object({
    facialTranslation: z.number().describe('面容翻译价格（元/分钟）'),
  }),
  erase: z.object({
    basePrice: z.number().describe('AI 字幕擦除基础价格（元/分钟）'),
  }),
  videoEdit: z.object({
    basePrice: z.number().describe('视频编辑基础价格（元/分钟，720P）'),
  }),
  dramaRecap: z.object({
    basePrice: z.number().describe('短剧解说基础价格（元/分钟）'),
  }).optional(),
})

export const aiConfigSchema = z.object({
  models: aiModelsConfigSchema,
  openai: openaiConfigSchema,
  volcengine: z.object({
    ...volcengineConfigSchema.shape,
    callbackUrl: z.string().optional(),
  }),
  grok: grokConfigSchema,
  aideo: aideoPricingConfigSchema,
  gemini: geminiConfigSchema,
  anthropic: z.object({
    baseUrl: z.string(),
    apiKey: z.string(),
  }),
  draftGeneration: z.object({
    imageModels: z.array(z.object({
      model: z.string().describe('实际模型名'),
      displayName: z.string().describe('展示名称'),
      supportedAspectRatios: z.array(z.string()).describe('支持的图片宽高比列表'),
      maxInputImages: z.number().int().min(1).describe('最多可输入的参考图片数量'),
      pricing: z.array(z.object({
        resolution: z.string().describe('分辨率，如 0.5K, 1K, 2K'),
        pricePerImage: z.number().describe('每张图片 USD 单价'),
      })),
    })),
  }),
})

// Agent 配置
export const agentConfigSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string(),
  taskTimeoutMs: z.number().default(60 * 60 * 1000).describe('Agent 任务超时时间（毫秒），默认 60 分钟'),
  gracefulShutdownTimeoutMs: z.number().optional(),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  auth: aitoearnAuthConfigSchema,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  serverClient: aitoearnServerClientConfigSchema,
  assets: assetsConfigSchema,
  ai: aiConfigSchema,
  agent: agentConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
