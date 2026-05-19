import { createZodDto, CreditsConsumptionSource, UserType } from '@yikart/common'
import { z } from 'zod'
import { AudioRole, ContentType, ImageRole, TaskStatus, ToolType, VideoRole } from '../../libs/volcengine'

// Volcengine视频生成请求
const volcengineGenerationRequestSchema = z.object({
  model: z.string().describe('模型ID或Endpoint ID'),
  content: z.array(z.union([
    z.object({
      type: z.literal(ContentType.Text),
      text: z.string(),
    }),
    z.object({
      type: z.literal(ContentType.ImageUrl),
      image_url: z.object({
        url: z.string(),
      }),
      role: z.enum(ImageRole).optional(),
    }),
    z.object({
      type: z.literal(ContentType.VideoUrl),
      video_url: z.object({
        url: z.string(),
      }),
      role: z.literal(VideoRole.ReferenceVideo),
    }),
    z.object({
      type: z.literal(ContentType.AudioUrl),
      audio_url: z.object({
        url: z.string(),
      }),
      role: z.literal(AudioRole.ReferenceAudio),
    }),
  ])).describe('输入内容'),
  return_last_frame: z.boolean().optional().describe('是否返回尾帧图像'),
  tools: z.array(z.object({
    type: z.literal(ToolType.WebSearch),
  })).optional().describe('模型工具配置'),
  resolution: z.string().optional().describe('分辨率'),
  ratio: z.string().optional().describe('宽高比'),
  duration: z.number().int().optional().describe('时长（秒）'),
  seed: z.number().int().optional().describe('随机种子'),
  watermark: z.boolean().optional().describe('是否带水印'),
  source: z.enum([CreditsConsumptionSource.AiVideo, CreditsConsumptionSource.AiDraftGeneration, CreditsConsumptionSource.Plugin]).optional().describe('消费来源'),
})

export class VolcengineGenerationRequestDto extends createZodDto(volcengineGenerationRequestSchema) {}

const userVolcengineGenerationRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...volcengineGenerationRequestSchema.shape,
})

export class UserVolcengineGenerationRequestDto extends createZodDto(userVolcengineGenerationRequestSchema) {}

// Volcengine回调接口DTO（与查询API返回格式一致）
const volcengineCallbackSchema = z.object({
  id: z.string(),
  model: z.string(),
  status: z.enum(TaskStatus),
  created_at: z.number(),
  updated_at: z.number(),
  content: z.object({
    video_url: z.string(),
    last_frame_url: z.string().optional(),
  }).optional(),
  error: z.object({
    message: z.string(),
    code: z.string(),
  }).optional().nullable(),
  seed: z.number().optional(),
  resolution: z.string().optional(),
  ratio: z.string().optional(),
  duration: z.number().optional(),
  framespersecond: z.number().optional(),
  usage: z.object({
    completion_tokens: z.number(),
    total_tokens: z.number(),
    tool_usage: z.object({
      web_search: z.number().optional(),
    }).optional(),
  }).optional(),
})

export class VolcengineCallbackDto extends createZodDto(volcengineCallbackSchema) {}
