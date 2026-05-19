import { createPaginationVo, createZodDto, zodI18nString } from '@yikart/common'
import { z } from 'zod'
import { AiLogStatus } from '../enums'

export const CreateDraftGenerationVoSchema = z.object({
  taskIds: z.array(z.string()).describe('生成任务 ID 列表（AiLog ID，可用于查询进度）'),
})

export class CreateDraftGenerationVo extends createZodDto(CreateDraftGenerationVoSchema, 'CreateDraftGenerationVo') {}

export const CreateDraftFromVideoUrlVoSchema = z.object({
  materialId: z.string().describe('生成后的草稿素材 ID'),
})

export type CreateDraftFromVideoUrlVoInput = z.input<typeof CreateDraftFromVideoUrlVoSchema>

export class CreateDraftFromVideoUrlVo extends createZodDto(CreateDraftFromVideoUrlVoSchema, 'CreateDraftFromVideoUrlVo') {}

export const DraftGenerationTaskVoSchema = z.object({
  id: z.string().describe('任务 ID'),
  status: z.enum(AiLogStatus).describe('任务状态'),
  points: z.number().describe('用量点数'),
  errorMessage: z.string().optional().describe('错误信息'),
  request: z.record(z.string(), z.unknown()).optional().describe('生成输入参数'),
  response: z.union([z.record(z.string(), z.unknown()), z.string()]).optional().describe('生成结果'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class DraftGenerationTaskVo extends createZodDto(DraftGenerationTaskVoSchema, 'DraftGenerationTaskVo') {}

export class DraftGenerationTaskListVo extends createPaginationVo(DraftGenerationTaskVoSchema, 'DraftGenerationTaskListVo') {}

export const DraftGenerationStatsVoSchema = z.object({
  generatingCount: z.number().describe('生成中任务数量'),
})

export class DraftGenerationStatsVo extends createZodDto(DraftGenerationStatsVoSchema, 'DraftGenerationStatsVo') {}

export const ImageModelPricingVoSchema = z.object({
  resolution: z.string().describe('分辨率'),
  pricePerImage: z.number().describe('每张图片 USD 单价'),
  originPrice: z.number().optional().describe('原价'),
})

export const ImageModelVoSchema = z.object({
  model: z.string().describe('模型名称'),
  displayName: z.string().describe('展示名称'),
  tags: z.array(zodI18nString()).default([]),
  supportedAspectRatios: z.array(z.string()).describe('支持的图片宽高比列表'),
  maxInputImages: z.number().describe('最多可输入的参考图片数量'),
  pricing: z.array(ImageModelPricingVoSchema).describe('分辨率价格表'),
})

export const VideoModelPricingVoSchema = z.object({
  resolution: z.string().optional().describe('分辨率'),
  aspectRatio: z.string().optional().describe('宽高比'),
  mode: z.string().optional().describe('生成模式'),
  duration: z.number().optional().describe('时长（秒）'),
  price: z.number().describe('价格'),
  originPrice: z.number().optional().describe('原价'),
})

export const VideoModelVoSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  channel: z.string().describe('渠道'),
  modes: z.array(z.string()).describe('支持的模式'),
  resolutions: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
  maxInputImages: z.number().describe('最大输入图片数'),
  aspectRatios: z.array(z.string()).describe('支持的宽高比列表'),
  tags: z.array(zodI18nString()).default([]).describe('标签'),
  defaults: z.object({
    resolution: z.string().optional().describe('默认分辨率'),
    aspectRatio: z.string().optional().describe('默认宽高比'),
    duration: z.number().optional().describe('默认时长'),
  }).describe('默认值'),
  pricing: z.array(VideoModelPricingVoSchema).describe('价格表'),
})

export const DraftGenerationPricingVoSchema = z.object({
  imageModels: z.array(ImageModelVoSchema).describe('图片生成模型价格列表'),
  videoModels: z.array(VideoModelVoSchema).describe('视频生成模型价格列表'),
})

export type DraftGenerationPricingVoInput = z.input<typeof DraftGenerationPricingVoSchema>

export class DraftGenerationPricingVo extends createZodDto(DraftGenerationPricingVoSchema, 'DraftGenerationPricingVo') {}
