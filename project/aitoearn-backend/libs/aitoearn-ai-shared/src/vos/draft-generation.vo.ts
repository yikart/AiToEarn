import { createPaginationVo, createZodDto, FileUtil, zodI18nString } from '@yikart/common'
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

export const DraftGenerationTaskQueueVoSchema = z.object({
  position: z.number().nullable().describe('当前队列中的排队位置，1 表示下一个待执行任务；执行中或无法定位时为 null'),
  waitingCount: z.number().describe('当前队列待执行任务总数'),
})

const fileUrlSchema = () => FileUtil.zodBuildUrl().optional()
const fileUrlListSchema = () => z.array(FileUtil.zodBuildUrl().nonoptional()).optional()

const DraftGenerationTaskPayloadVoSchema = z.object({
  imageUrl: fileUrlSchema().describe('图片 URL'),
  imageUrls: fileUrlListSchema().describe('图片 URL 列表'),
  videoUrl: fileUrlSchema().describe('视频 URL'),
  videoUrls: fileUrlListSchema().describe('视频 URL 列表'),
  audioUrl: fileUrlSchema().describe('音频 URL'),
  audioUrls: fileUrlListSchema().describe('音频 URL 列表'),
  coverUrl: fileUrlSchema().describe('封面 URL'),
  url: fileUrlSchema().describe('媒体 URL'),
  thumbUrl: fileUrlSchema().describe('缩略图 URL'),
}).loose()

export const DraftGenerationTaskVoSchema = z.object({
  id: z.string().describe('任务 ID'),
  status: z.enum(AiLogStatus).describe('任务状态'),
  errorMessage: z.string().optional().describe('错误信息'),
  request: DraftGenerationTaskPayloadVoSchema.optional().describe('生成输入参数'),
  response: z.union([DraftGenerationTaskPayloadVoSchema, z.string()]).optional().describe('生成结果'),
  queue: DraftGenerationTaskQueueVoSchema.optional().describe('任务队列展示信息'),
  createdAt: z.coerce.date().describe('创建时间'),
  updatedAt: z.coerce.date().describe('更新时间'),
})

export class DraftGenerationTaskVo extends createZodDto(DraftGenerationTaskVoSchema, 'DraftGenerationTaskVo') {}

export class DraftGenerationTaskListVo extends createPaginationVo(DraftGenerationTaskVoSchema, 'DraftGenerationTaskListVo') {}

export const DraftGenerationStatsVoSchema = z.object({
  generatingCount: z.number().describe('生成中任务数量'),
})

export class DraftGenerationStatsVo extends createZodDto(DraftGenerationStatsVoSchema, 'DraftGenerationStatsVo') {}

export const ImageModelPricingVoSchema = z.object({
  resolution: z.string().describe('分辨率'),
})

export const ImageModelVoSchema = z.object({
  model: z.string().describe('模型名称'),
  displayName: z.string().describe('展示名称'),
  tags: z.array(zodI18nString()).default([]),
  supportedAspectRatios: z.array(z.string()).describe('支持的图片宽高比列表'),
  maxInputImages: z.number().describe('最多可输入的参考图片数量'),
  pricing: z.array(ImageModelPricingVoSchema).describe('分辨率价格表'),
})

const VideoModelInputConstraintVoSchema = z.object({
  maxCount: z.number().optional().describe('最大输入数量'),
  formats: z.array(z.string()).optional().describe('支持的文件格式'),
  minDuration: z.number().optional().describe('最小时长（秒）'),
  maxDuration: z.number().optional().describe('单个文件最大时长（秒）'),
  maxTotalDuration: z.number().optional().describe('总最大时长（秒）'),
  maxSizeMb: z.number().optional().describe('单个文件最大大小（MB）'),
  minAspectRatio: z.number().optional().describe('最小宽高比'),
  maxAspectRatio: z.number().optional().describe('最大宽高比'),
  minWidth: z.number().optional().describe('最小宽度'),
  maxWidth: z.number().optional().describe('最大宽度'),
  minPixels: z.number().optional().describe('最小像素数'),
  maxPixels: z.number().optional().describe('最大像素数'),
  minFps: z.number().optional().describe('最小帧率'),
  maxFps: z.number().optional().describe('最大帧率'),
})

const VideoModelInputConstraintsVoSchema = z.object({
  images: VideoModelInputConstraintVoSchema.optional().describe('图片输入约束'),
  videos: VideoModelInputConstraintVoSchema.optional().describe('视频输入约束'),
  audios: VideoModelInputConstraintVoSchema.optional().describe('音频输入约束'),
}).optional().describe('多模态输入约束')

export const VideoModelVoSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  channel: z.string().describe('渠道'),
  modes: z.array(z.string()).describe('支持的模式'),
  resolutions: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
  maxInputImages: z.number().describe('最大输入图片数'),
  inputConstraints: VideoModelInputConstraintsVoSchema,
  aspectRatios: z.array(z.string()).describe('支持的宽高比列表'),
  tags: z.array(zodI18nString()).default([]).describe('标签'),
  defaults: z.object({
    resolution: z.string().optional().describe('默认分辨率'),
    aspectRatio: z.string().optional().describe('默认宽高比'),
    duration: z.number().optional().describe('默认时长'),
  }).describe('默认值'),
})

export const DraftGenerationPricingVoSchema = z.object({
  imageModels: z.array(ImageModelVoSchema).describe('图片生成模型价格列表'),
  videoModels: z.array(VideoModelVoSchema).describe('视频生成模型价格列表'),
})

export type DraftGenerationPricingVoInput = z.input<typeof DraftGenerationPricingVoSchema>

export class DraftGenerationPricingVo extends createZodDto(DraftGenerationPricingVoSchema, 'DraftGenerationPricingVo') {}
