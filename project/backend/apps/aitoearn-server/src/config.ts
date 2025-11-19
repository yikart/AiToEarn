import { aitoearnAuthConfigSchema } from '@yikart/aitoearn-auth'
import { s3ConfigSchema } from '@yikart/aws-s3'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { AiLogChannel, mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import z from 'zod'
import { dashscopeConfigSchema } from './ai/libs/dashscope'
import { fireflycardConfigSchema } from './ai/libs/fireflycard'
import { klingConfigSchema } from './ai/libs/kling'
import { md2cardConfigSchema } from './ai/libs/md2card'
import { openaiConfigSchema } from './ai/libs/openai'
import { sora2ConfigSchema } from './ai/libs/sora2'
import { volcengineConfigSchema } from './ai/libs/volcengine'

const mailConfigSchema = z.object({
  transport: z.object({
    host: z.string().default(''),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().default(''),
      pass: z.string().default(''),
    }),
  }),
  defaults: z.object({
    from: z.string().default(''),
  }),
  template: z.object({
    dir: z.string().default(''),
    adapter: z.any().optional(),
    options: z.object({
      strict: z.boolean().default(true),
    }).optional(),
  }).optional(),
})

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
    pricing: z.union([
      z.object({
        discount: z.string().optional(),
        prompt: z.string(),
        originPrompt: z.string().optional(),
        completion: z.string(),
        originCompletion: z.string().optional(),
        image: z.string().optional(),
        originImage: z.string().optional(),
        audio: z.string().optional(),
        originAudio: z.string().optional(),
      }),
      z.object({
        price: z.string(),
        discount: z.string().optional(),
        originPrice: z.string().optional(),
      }),
    ]),
    freeForVip: z.boolean().optional(),
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
      discount: z.string().optional(),
      originPrice: z.string().optional(),
      freeForVip: z.boolean().optional(),
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
      discount: z.string().optional(),
      originPrice: z.string().optional(),
      maxInputImages: z.number(),
      freeForVip: z.boolean().optional(),
    })),
  }),
  video: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      summary: z.string().optional(),
      logo: z.string().optional(),
      tags: z.string().array().default([]),
      mainTag: z.string().optional(),
      channel: z.enum(AiLogChannel),
      modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video', 'multi-image2video'])),
      resolutions: z.array(z.string()),
      durations: z.array(z.number()),
      supportedParameters: z.array(z.string()),
      defaults: z.object({
        resolution: z.string().optional(),
        aspectRatio: z.string().optional(),
        mode: z.string().optional(),
        duration: z.number().optional(),
      }).optional(),
      pricing: z.object({
        resolution: z.string().optional(),
        aspectRatio: z.string().optional(),
        mode: z.string().optional(),
        duration: z.number().optional(),
        price: z.number(),
        discount: z.string().optional(),
        originPrice: z.number().optional(),
      }).array(),
      freeForVip: z.boolean().optional(),
    })),
  }),
})

export const aiConfigSchema = z.object({
  models: aiModelsConfigSchema,
  openai: openaiConfigSchema,
  fireflycard: fireflycardConfigSchema,
  md2card: md2cardConfigSchema,
  kling: z.object({
    ...klingConfigSchema.shape,
    callbackUrl: z.string().optional(),
  }),
  volcengine: z.object({
    ...volcengineConfigSchema.shape,
    callbackUrl: z.string().optional(),
  }),
  dashscope: z.object({
    ...dashscopeConfigSchema.shape,
    callbackUrl: z.string().optional(),
  }),
  sora2: sora2ConfigSchema,
})

const AliGreenConfigSchema = z.object({
  accessKeyId: z.string().default(''),
  accessKeySecret: z.string().default(''),
  endpoint: z.string().default(''),
})

// MoreAPI配置
const moreApiConfigSchema = z.object({
  platApiUri: z.string().default(''),
  xhsCreatorUri: z.string().default(''),
})

/** Listmonk配置 */
const listmonkConfigSchema = z.object({
  host: z.string().default(''),
  apiKey: z.string().default(''),
  apiSecret: z.string().default(''),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  auth: aitoearnAuthConfigSchema,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  awsS3: s3ConfigSchema,
  mail: mailConfigSchema,
  environment: z.string().default('development'),
  ai: aiConfigSchema,
  aliGreen: AliGreenConfigSchema,
  mailBackHost: z.string(),
  channelApi: z.object({
    baseUrl: z.string().default('http://localhost:3000'),
  }),
  paymentApi: z.object({
    baseUrl: z.string().default('http://localhost:3000'),
  }),
  moreApi: moreApiConfigSchema,
  statisticsDb: mongodbConfigSchema,
  listmonk: listmonkConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
