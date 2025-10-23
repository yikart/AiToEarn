import { createZodDto } from '@yikart/common'
import { AiLogChannel } from '@yikart/mongodb'
import { z } from 'zod'

export const aiModelsConfigSchema = z.object({
  chat: z.array(
    z.object({
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
    }),
  ),
  image: z.object({
    generation: z.array(
      z.object({
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
      }),
    ),
    edit: z.array(
      z.object({
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
      }),
    ),
  }),
  video: z.object({
    generation: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        summary: z.string().optional(),
        logo: z.string().optional(),
        tags: z.string().array().default([]),
        mainTag: z.string().optional(),
        channel: z.enum(AiLogChannel),
        modes: z.array(
          z.enum([
            'text2video',
            'image2video',
            'flf2video',
            'lf2video',
            'multi-image2video',
          ]),
        ),
        resolutions: z.array(z.string()),
        durations: z.array(z.number()),
        supportedParameters: z.array(z.enum(['image', 'image_tail'])),
        defaults: z
          .object({
            resolution: z.string().optional(),
            aspectRatio: z.string().optional(),
            mode: z.string().optional(),
            duration: z.number().optional(),
          })
          .optional(),
        pricing: z
          .object({
            resolution: z.string().optional(),
            aspectRatio: z.string().optional(),
            mode: z.string().optional(),
            duration: z.number().optional(),
            price: z.number(),
            discount: z.string().optional(),
            originPrice: z.number().optional(),
          })
          .array(),
      }),
    ),
  }),
})

export class AiModelsConfigDto extends createZodDto(aiModelsConfigSchema) {}
