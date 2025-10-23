import { createPaginationVo, createZodDto, UserType } from '@yikart/common'
import { AiLogChannel, AiLogStatus, AiLogType } from '@yikart/mongodb'
import { z } from 'zod'
import { DashscopeTaskStatus } from './common'
import { aiModelsConfigSchema, messageContentComplexSchema } from './dto'

const modalitiesTokenDetails = z.object({
  text: z.number().optional(),
  image: z.number().optional(),
  audio: z.number().optional(),
  video: z.number().optional(),
  document: z.number().optional(),
})

const chatCompletionVoSchema = z.object({
  content: z
    .union([z.string(), z.array(messageContentComplexSchema)])
    .describe('生成内容'),
  model: z.string().optional().describe('使用的模型'),
  usage: z
    .object({
      points: z.number().optional(),
      input_tokens: z.number().optional().describe('输入token数'),
      output_tokens: z.number().optional().describe('输出token数'),
      total_tokens: z.number().optional().describe('总token数'),
      input_token_details: z
        .object({
          ...modalitiesTokenDetails.shape,
          cache_read: z.number().optional(),
          cache_creation: z.number().optional(),
        })
        .optional(),
      output_token_details: z
        .object({
          ...modalitiesTokenDetails.shape,
          reasoning: z.number().optional(),
        })
        .optional(),
    })
    .optional()
    .describe('token 使用情况'),
})

export class ChatCompletionVo extends createZodDto(chatCompletionVoSchema) {}

// 图片编辑模型参数 VO
const chatModelSchema = z.object({
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
})

export class ChatModelConfigVo extends createZodDto(chatModelSchema) {}

// 使用情况统计
const usageMetadataSchema = z.object({
  input_tokens: z.number().optional().describe('输入token数'),
  output_tokens: z.number().optional().describe('输出token数'),
  total_tokens: z.number().optional().describe('总token数'),
})

// 图片对象
const imageObjectSchema = z.object({
  url: z.string().optional().describe('图片URL'),
  b64_json: z.string().optional().describe('base64编码的图片'),
  revised_prompt: z.string().optional().describe('修订后的提示词'),
})

// 用户图片响应
const userImageResponseSchema = z.object({
  created: z.number().describe('创建时间戳'),
  list: z.array(imageObjectSchema).describe('生成的图片列表'),
  usage: usageMetadataSchema.optional().describe('token使用情况'),
})

export class ImageResponseVo extends createZodDto(userImageResponseSchema) {}

// 图片生成模型参数 VO
const imageGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.string().array().default([]),
  mainTag: z.string().optional(),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  qualities: z.array(z.string()).describe('支持的质量选项'),
  styles: z.array(z.string()).describe('支持的风格选项'),
  pricing: z.string(),
  discount: z.string().optional(),
  originPrice: z.string().optional(),
})

export class ImageGenerationModelParamsVo extends createZodDto(
  imageGenerationModelSchema,
) {}

// 图片编辑模型参数 VO
const imageEditModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.string().array().default([]),
  mainTag: z.string().optional(),
  sizes: z.array(z.string()).describe('支持的尺寸'),
  pricing: z.string(),
  discount: z.string().optional(),
  originPrice: z.string().optional(),
  maxInputImages: z.number(),
})

export class ImageEditModelParamsVo extends createZodDto(
  imageEditModelSchema,
) {}

// MD2Card生成响应
const md2CardResponseSchema = z.object({
  images: z
    .array(
      z.object({
        url: z.string().describe('图片URL'),
        fileName: z.string().describe('文件名'),
      }),
    )
    .describe('生成的卡片图片'),
})

export class Md2CardResponseVo extends createZodDto(md2CardResponseSchema) {}

// Fireflycard生成响应
const fireflycardResponseSchema = z.object({
  image: z.string().describe('生成的卡片图片base64数据'),
})

export class FireflycardResponseVo extends createZodDto(
  fireflycardResponseSchema,
) {}
// 日志基本信息
const logItemSchema = z.object({
  id: z.string().describe('日志ID'),
  userId: z.string().describe('用户ID'),
  userType: z.enum(UserType).describe('用户类型'),
  taskId: z.string().describe('任务ID'),
  type: z.enum(AiLogType).describe('日志类型'),
  model: z.string().describe('模型'),
  channel: z.enum(AiLogChannel).describe('渠道'),
  action: z.string().optional().describe('操作'),
  status: z.enum(AiLogStatus).describe('日志状态'),
  startedAt: z.date().describe('开始时间'),
  duration: z.number().optional().describe('持续时间'),
  points: z.number().describe('积分'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class LogItemVo extends createZodDto(logItemSchema) {}

// 日志列表响应
export class LogListResponseVo extends createPaginationVo(
  logItemSchema,
  'LogListResponseVo',
) {}

// 日志详情响应
const logDetailResponseSchema = z.object({
  id: z.string().describe('日志ID'),
  taskId: z.string().describe('任务ID'),
  type: z.enum(AiLogType).describe('日志类型'),
  model: z.string().describe('模型'),
  channel: z.enum(AiLogChannel).describe('渠道'),
  action: z.string().optional().describe('操作'),
  status: z.enum(AiLogStatus).describe('日志状态'),
  startedAt: z.date().describe('开始时间'),
  duration: z.number().optional().describe('持续时间'),
  request: z.record(z.string(), z.unknown()).describe('请求参数'),
  response: z.record(z.string(), z.unknown()).optional().describe('响应结果'),
  errorMessage: z.string().optional().describe('错误信息'),
  points: z.number().describe('积分'),
  createdAt: z.date().describe('创建时间'),
  updatedAt: z.date().describe('更新时间'),
})

export class LogDetailResponseVo extends createZodDto(
  logDetailResponseSchema,
) {}
// Kling视频生成响应
const klingVideoGenerationResponseSchema = z.object({
  task_id: z.string(),
  task_status: z.string().optional(),
})

// Volcengine视频生成响应
const volcengineVideoGenerationResponseSchema = z.object({
  id: z.string(),
})

// 通用视频生成响应
const videoGenerationResponseSchema = z.object({
  task_id: z.string(),
  status: z.string(),
})

export class KlingVideoGenerationResponseVo extends createZodDto(
  klingVideoGenerationResponseSchema,
) {}
export class VolcengineVideoGenerationResponseVo extends createZodDto(
  volcengineVideoGenerationResponseSchema,
) {}
export class VideoGenerationResponseVo extends createZodDto(
  videoGenerationResponseSchema,
) {}

// Kling 任务状态响应 VO
const klingTaskStatusResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  task_status: z.string().describe('任务状态'),
  task_status_msg: z.string().describe('任务状态信息'),
  task_info: z
    .object({
      parent_video: z
        .object({
          id: z.string(),
          url: z.string(),
          duration: z.string(),
        })
        .optional(),
      external_task_id: z.string().optional(),
    })
    .optional()
    .describe('任务信息'),
  task_result: z
    .object({
      images: z
        .array(
          z.object({
            index: z.number(),
            url: z.string(),
          }),
        )
        .optional(),
      videos: z
        .array(
          z.object({
            id: z.string(),
            url: z.string(),
            duration: z.string(),
          }),
        )
        .optional(),
    })
    .optional()
    .describe('任务结果'),
  created_at: z.number().describe('创建时间'),
  updated_at: z.number().describe('更新时间'),
})

export class KlingTaskStatusResponseVo extends createZodDto(
  klingTaskStatusResponseSchema,
) {}

// Volcengine 任务状态响应 VO
const volcengineTaskStatusResponseSchema = z.object({
  id: z.string().describe('任务ID'),
  model: z.string().describe('模型名称'),
  status: z.string().describe('任务状态'),
  error: z
    .object({
      message: z.string(),
      code: z.string(),
    })
    .nullable()
    .describe('错误信息'),
  created_at: z.number().describe('创建时间'),
  updated_at: z.number().describe('更新时间'),
  content: z
    .object({
      video_url: z.string().optional(),
      last_frame_url: z.string().optional(),
    })
    .optional()
    .describe('视频内容'),
  seed: z.number().optional().describe('种子值'),
  resolution: z.string().optional().describe('分辨率'),
  ratio: z.string().optional().describe('宽高比'),
  duration: z.number().optional().describe('时长'),
  framespersecond: z.number().optional().describe('帧率'),
  usage: z
    .object({
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
    })
    .optional()
    .describe('使用量统计'),
})

export class VolcengineTaskStatusResponseVo extends createZodDto(
  volcengineTaskStatusResponseSchema,
) {}

// 通用视频任务状态响应
const videoTaskStatusResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  action: z.string().describe('任务动作'),
  status: z.string().describe('任务状态'),
  fail_reason: z.string().optional().describe('失败原因或视频URL'),
  submit_time: z.number().describe('提交时间'),
  start_time: z.number().describe('开始时间'),
  finish_time: z.number().describe('完成时间'),
  progress: z.string().describe('任务进度'),
  data: z.any(),
})

export class VideoTaskStatusResponseVo extends createZodDto(
  videoTaskStatusResponseSchema,
) {}

export class ListVideoTasksResponseVo extends createPaginationVo(
  videoTaskStatusResponseSchema,
) {}

// 视频生成模型参数 VO
const videoGenerationModelSchema = z.object({
  name: z.string().describe('模型名称'),
  description: z.string().describe('模型描述'),
  summary: z.string().optional(),
  logo: z.string().optional(),
  tags: z.string().array().default([]),
  mainTag: z.string().optional(),
  modes: z
    .array(
      z.enum([
        'text2video',
        'image2video',
        'flf2video',
        'lf2video',
        'multi-image2video',
      ]),
    )
    .describe('支持的模式'),
  channel: z.enum(AiLogChannel),
  resolutions: z.array(z.string()).describe('支持的尺寸'),
  durations: z.array(z.number()).describe('支持的时长'),
  supportedParameters: z.array(z.string()).describe('支持的参数'),
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
})

export class VideoGenerationModelParamsVo extends createZodDto(
  videoGenerationModelSchema,
) {}

// Dashscope 视频生成响应 VO
const dashscopeVideoGenerationResponseSchema = z.object({
  task_id: z.string().describe('任务ID'),
  task_status: z.enum(DashscopeTaskStatus).optional().describe('任务状态'),
})

export class DashscopeVideoGenerationResponseVo extends createZodDto(
  dashscopeVideoGenerationResponseSchema,
) {}

// Dashscope 任务状态响应 VO
const dashscopeTaskStatusResponseSchema = z.object({
  status_code: z.number().describe('HTTP状态码'),
  request_id: z.string().describe('请求ID'),
  code: z.string().nullable().describe('错误码'),
  message: z.string().describe('错误消息'),
  output: z
    .object({
      task_id: z.string().describe('任务ID'),
      task_status: z.enum(DashscopeTaskStatus).describe('任务状态'),
      video_url: z.string().optional().describe('视频URL'),
      submit_time: z.string().optional().describe('任务提交时间'),
      scheduled_time: z.string().optional().describe('任务调度时间'),
      end_time: z.string().optional().describe('任务结束时间'),
      orig_prompt: z.string().optional().describe('原始提示词'),
      actual_prompt: z.string().optional().describe('实际使用的提示词'),
    })
    .describe('输出结果'),
  usage: z
    .object({
      video_count: z.number().describe('视频数量'),
      video_duration: z.number().describe('视频时长'),
      video_ratio: z.string().describe('视频分辨率'),
    })
    .nullable()
    .optional()
    .describe('使用量统计'),
})

export class DashscopeTaskStatusResponseVo extends createZodDto(
  dashscopeTaskStatusResponseSchema,
) {}

export class AiModelsConfigVo extends createZodDto(aiModelsConfigSchema) {}
