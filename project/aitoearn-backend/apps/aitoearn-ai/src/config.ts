import { aitoearnAuthConfigSchema } from '@yikart/aitoearn-auth'
import { assetsConfigSchema } from '@yikart/assets'
import { baseConfig, createZodDto, i18nObjectSchema, selectConfig } from '@yikart/common'
import { AiLogChannel, mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import z from 'zod'
import { dashscopeConfigSchema } from './core/ai/libs/dashscope'
import { geminiConfigSchema } from './core/ai/libs/gemini'
import { grokConfigSchema } from './core/ai/libs/grok'
import { openaiConfigSchema } from './core/ai/libs/openai'
import { relayConfigSchema } from './core/ai/libs/relay/relay.config'
import { volcengineConfigSchema } from './core/ai/libs/volcengine'

const videoModelInputConstraintSchema = z.object({
  maxCount: z.number().int().min(0).optional(),
  formats: z.array(z.string()).optional(),
  minDuration: z.number().positive().optional(),
  maxDuration: z.number().positive().optional(),
  maxTotalDuration: z.number().positive().optional(),
  maxSizeMb: z.number().positive().optional(),
  minAspectRatio: z.number().positive().optional(),
  maxAspectRatio: z.number().positive().optional(),
  minWidth: z.number().int().positive().optional(),
  maxWidth: z.number().int().positive().optional(),
  minPixels: z.number().int().positive().optional(),
  maxPixels: z.number().int().positive().optional(),
  minFps: z.number().positive().optional(),
  maxFps: z.number().positive().optional(),
})

const videoModelInputConstraintsSchema = z.object({
  images: videoModelInputConstraintSchema.optional(),
  videos: videoModelInputConstraintSchema.optional(),
  audios: videoModelInputConstraintSchema.optional(),
}).optional()

const videoModelRuntimeFallbackSchema = z.object({
  channel: z.enum(AiLogChannel),
  model: z.string(),
}).strict()

const videoModelRuntimeModelSchema = z.object({
  model: z.string(),
  mode: z.string().optional(),
  resolution: z.string().optional(),
  fallback: videoModelRuntimeFallbackSchema.optional(),
}).strict()

export const aiModelsConfigSchema = z.object({
  chat: z.array(z.object({
    name: z.string(),
    description: z.string(),
    summary: z.string().optional(),
    logo: z.string().optional(),
    tags: z.array(i18nObjectSchema).default([]),
    mainTag: z.string().optional(),
    channel: z.enum(AiLogChannel),
    scenes: z.string().array().optional(),
    inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
  })),
  image: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.array(i18nObjectSchema).default([]),
      mainTag: z.string().optional(),
      runtimeModel: z.string().optional(),
      retry: z.number().int().min(0).optional(),
      sizes: z.array(z.string()),
      qualities: z.array(z.string()),
      styles: z.array(z.string()),
    })),
    edit: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.array(i18nObjectSchema).default([]),
      mainTag: z.string().optional(),
      runtimeModel: z.string().optional(),
      retry: z.number().int().min(0).optional(),
      sizes: z.array(z.string()),
      maxInputImages: z.number(),
    })),
  }),
  video: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.array(i18nObjectSchema).default([]),
      mainTag: z.string().optional(),
      channel: z.enum(AiLogChannel),
      modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video', 'multi-image2video', 'multi-ref', 'video2video'])),
      resolutions: z.array(z.string()),
      durations: z.array(z.number()),
      maxInputImages: z.number().int().min(0),
      inputConstraints: videoModelInputConstraintsSchema,
      aspectRatios: z.array(z.string()),
      runtimeModels: z.array(videoModelRuntimeModelSchema).optional(),
      defaults: z.object({
        resolution: z.string().optional(),
        aspectRatio: z.string().optional(),
        duration: z.number().optional(),
      }),
      queuePriority: z.number().int().min(1).max(2097152).optional(),
      retry: z.number().int().min(0).optional(),
    })),
  }),
})

export const aiConfigSchema = z.object({
  models: aiModelsConfigSchema,
  openai: openaiConfigSchema,
  volcengine: z.object({
    ...volcengineConfigSchema.shape,
    callbackUrl: z.string().optional(),
  }),
  grok: grokConfigSchema,
  dashscope: dashscopeConfigSchema,
  gemini: geminiConfigSchema,
  relay: relayConfigSchema.optional(),
  anthropic: z.object({
    baseUrl: z.string(),
    apiKey: z.string(),
  }),
  draftGeneration: z.object({
    planner: z.object({
      defaultModel: z.string(),
    }),
    queue: z.object({
      lowPriorityMinPriority: z.number().int().min(1).max(2097152),
      lowPriorityConcurrency: z.number().int().min(1),
    }).default({
      lowPriorityMinPriority: 1000,
      lowPriorityConcurrency: 2,
    }),
    imageModels: z.array(z.object({
      model: z.string().describe('对外模型名'),
      displayName: z.string().describe('展示名称'),
      runtimeModel: z.string().optional().describe('实际调用的上游模型名'),
      queuePriority: z.number().int().min(1).max(2097152).optional().describe('BullMQ priority，数值越小优先级越高'),
      tags: z.array(i18nObjectSchema).default([]),
      supportedAspectRatios: z.array(z.string()).describe('支持的图片宽高比列表'),
      maxInputImages: z.number().int().min(1).describe('最多可输入的参考图片数量'),
    })),
  }),
})

const defaultAgentModels = [
  'claude-opus-4-6',
  'claude-haiku-4-5-20251001-thinking',
  'claude-opus-4-5-20251101-thinking',
  'claude-opus-4-5-20251101',
  'claude-sonnet-4-5-20250929-thinking',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-1-20250805',
  'claude-opus-4-1-20250805-thinking',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-6',
  'claude-opus-4-6-thinking',
]

const agentModelNameSchema = z.string().min(1).regex(/^[^,]+$/)

// Agent 配置
export const agentConfigSchema = z.object({
  baseUrl: z.string(),
  apiKey: z.string(),
  models: z.array(agentModelNameSchema).min(1).default(defaultAgentModels).describe('Agent 可用模型列表'),
  defaultModel: agentModelNameSchema.default('claude-opus-4-6').describe('Agent 默认模型'),
  backgroundModel: agentModelNameSchema.default('claude-haiku-4-5-20251001').describe('Agent 后台子任务模型'),
  thinkModel: agentModelNameSchema.default('claude-opus-4-6').describe('Agent 思考任务模型'),
  taskTimeoutMs: z.number().default(60 * 60 * 1000).describe('Agent 任务超时时间（毫秒），默认 60 分钟'),
}).superRefine((agent, ctx) => {
  const configuredModels = new Set(agent.models)

  for (const [field, model] of Object.entries({
    defaultModel: agent.defaultModel,
    backgroundModel: agent.backgroundModel,
    thinkModel: agent.thinkModel,
  })) {
    if (!configuredModels.has(model)) {
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} must be included in agent.models`,
      })
    }
  }
})

const serverClientConfigSchema = z.object({
  baseUrl: z.string(),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  auth: aitoearnAuthConfigSchema,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  serverClient: serverClientConfigSchema,
  assets: assetsConfigSchema,
  ai: aiConfigSchema,
  agent: agentConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
