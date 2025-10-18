import { ansibleConfigSchema } from '@yikart/ansible'
import { s3ConfigSchema } from '@yikart/aws-s3'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'
import { AiLogChannel, mongodbConfigSchema } from '@yikart/mongodb'
import { oneSignalConfigSchema } from '@yikart/one-signal'
import { redlockConfigSchema } from '@yikart/redlock'
import { ucloudConfigSchema } from '@yikart/ucloud'
import z from 'zod'
import { dashscopeConfigSchema } from './ai/libs/dashscope'
import { fireflycardConfigSchema } from './ai/libs/fireflycard'
import { klingConfigSchema } from './ai/libs/kling'
import { md2cardConfigSchema } from './ai/libs/md2card'
import { openaiConfigSchema } from './ai/libs/openai'
import { volcengineConfigSchema } from './ai/libs/volcengine'

// JWT配置
const jwtConfigSchema = z.object({
  secret: z.string().default(''),
  expiresIn: z.number().default(7 * 24 * 60 * 60),
})

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
  template: z.any().optional(),
})

const aiModelsConfigSchema = z.object({
  chat: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    pricing: z.union([
      z.object({
        prompt: z.string(),
        completion: z.string(),
        image: z.string().optional(),
        audio: z.string().optional(),
      }),
      z.object({
        price: z.string(),
      }),
    ]),
  })),
  image: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      sizes: z.array(z.string()),
      qualities: z.array(z.string()),
      styles: z.array(z.string()),
      pricing: z.string(),
    })),
    edit: z.array(z.object({
      name: z.string(),
      description: z.string(),
      sizes: z.array(z.string()),
      pricing: z.string(),
      maxInputImages: z.number(),
    })),
  }),
  video: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      channel: z.enum(AiLogChannel),
      modes: z.array(z.enum(['text2video', 'image2video', 'flf2video', 'lf2video'])),
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
      }).array(),
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
})

const AliGreenConfigSchema = z.object({
  accessKeyId: z.string().default(''),
  accessKeySecret: z.string().default(''),
  endpoint: z.string().default(''),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  ucloud: z.object({
    ...ucloudConfigSchema.shape,
    imageId: z.string(),
    bundleId: z.string(),
  }),
  redis: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    keepAlive: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    db: z.number().optional(),
    connectTimeout: z.number().optional().default(10000),
  }),
  multilogin: z.object({
    launcherBaseUrl: z.string().default('https://launcher.mlx.yt:45001'),
    profileBaseUrl: z.string().default('https://api.multilogin.com'),
    timeout: z.number().default(30000),
    folderId: z.string(),
    defaultUrl: z.string().default('https://example.com'),
    agent: z.object({
      url: z.string().default('https://example.com'),
      gitUrl: z.string(),
      gitBranch: z.string(),
    }),
  }),
  github: z.object({
    token: z.string(),
    repo: z.string(),
  }),
  ansible: ansibleConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  jwt: jwtConfigSchema,
  oneSignal: oneSignalConfigSchema,
  s3: s3ConfigSchema,
  mail: mailConfigSchema,
  environment: z.string().default('development'),
  ai: aiConfigSchema,
  aliGreen: AliGreenConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) { }

export const config = selectConfig(AppConfig)
