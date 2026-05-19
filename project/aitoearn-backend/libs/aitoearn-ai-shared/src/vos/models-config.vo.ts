import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { chatModelSchema } from './chat.vo'
import { imageEditModelSchema, imageGenerationModelSchema } from './image.vo'
import { videoGenerationModelSchema } from './video.vo'

export const modelsConfigSchema = z.object({
  chat: z.array(chatModelSchema).describe('对话模型列表'),
  image: z.object({
    generation: z.array(imageGenerationModelSchema).describe('图片生成模型列表'),
    edit: z.array(imageEditModelSchema).describe('图片编辑模型列表'),
  }).describe('图片模型配置'),
  video: z.object({
    generation: z.array(videoGenerationModelSchema).describe('视频生成模型列表'),
  }).describe('视频模型配置'),
})

export class ModelsConfigVo extends createZodDto(modelsConfigSchema) {}

export type ModelsConfigDto = z.infer<typeof modelsConfigSchema>
