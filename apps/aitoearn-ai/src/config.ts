import { fireflycardConfigSchema } from '@libs/fireflycard'
import { md2cardConfigSchema } from '@libs/md2card'
import { newApiConfigSchema } from '@libs/new-api'
import { s3ConfigSchema } from '@yikart/aws-s3'
import { baseConfig, createZodDto, selectConfig } from '@yikart/common'

import { mongodbConfigSchema } from '@yikart/mongodb'
import z from 'zod'

const aiModelsConfigSchema = z.object({
  chat: z.array(z.object({
    name: z.string(),
    description: z.string(),
    inputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    outputModalities: z.array(z.enum(['text', 'image', 'video', 'audio'])),
    pricing: z.object({
      prompt: z.string(),
      completion: z.string(),
      image: z.string().optional(),
      audio: z.string().optional(),
    }),
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
    })),
  }),
  video: z.object({
    generation: z.array(z.object({
      name: z.string(),
      description: z.string(),
      modes: z.array(z.enum(['text2video', 'image2video'])),
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
  fireflycard: fireflycardConfigSchema,
  md2card: md2cardConfigSchema,
  newApi: newApiConfigSchema,
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodb: mongodbConfigSchema,
  s3: s3ConfigSchema,
  ai: aiConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
