import { createZodDto, PaginationDtoSchema } from '@yikart/common'
import { z } from 'zod'
import { AspectRatio, Mode } from '../libs/kling'
import { ContentType, ImageRole } from '../libs/volcengine'
// 移除了不必要的类型导入，因为现在使用zod schema

// 通用视频生成请求
const videoGenerationRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().optional().describe('图片URL或base64'),
  // image: z.string().or(z.string().array()).optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.any()).optional().describe('其他参数'),
})

export class VideoGenerationRequestDto extends createZodDto(videoGenerationRequestSchema) {}

// 通用视频任务状态查询
const videoTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class VideoTaskQueryDto extends createZodDto(videoTaskQuerySchema) {}

// 通用视频任务状态查询
const listUserVideoTasksQuerySchema = z.object({
  ...PaginationDtoSchema.shape,
})

export class UserListVideoTasksQueryDto extends createZodDto(listUserVideoTasksQuerySchema) {}

// Kling文生视频请求
const klingText2VideoRequestSchema = z.object({
  model_name: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(2500).describe('正向文本提示词'),
  negative_prompt: z.string().max(2500).optional().describe('负向文本提示词'),
  cfg_scale: z.number().min(0).max(1).optional().describe('生成视频的自由度'),
  mode: z.enum(Mode).optional().describe('生成视频的模式'),
  duration: z.enum(['5', '10']).optional().describe('生成视频时长'),
  external_task_id: z.string().optional().describe('自定义任务ID'),
})

export class KlingText2VideoRequestDto extends createZodDto(klingText2VideoRequestSchema) {}

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
  ])).describe('输入内容'),
  return_last_frame: z.boolean().optional().describe('是否返回尾帧图像'),
})

export class VolcengineGenerationRequestDto extends createZodDto(volcengineGenerationRequestSchema) {}

// 图生视频请求DTO
const klingImage2VideoRequestSchema = z.object({
  model_name: z.string().min(1).describe('模型名称'),
  image: z.string().optional().describe('参考图像'),
  image_tail: z.string().optional().describe('参考图像 - 尾帧控制'),
  prompt: z.string().optional().describe('正向文本提示词'),
  negative_prompt: z.string().optional().describe('负向文本提示词'),
  cfg_scale: z.number().optional().describe('生成视频的自由度'),
  mode: z.enum(Mode).optional().describe('生成视频的模式'),
  static_mask: z.string().optional().describe('静态笔刷涂抹区域'),
  dynamic_masks: z.array(z.any()).optional().describe('动态笔刷配置列表'),
  camera_control: z.any().optional().describe('控制摄像机运动的协议'),
  duration: z.enum(['5', '10']).optional().describe('生成视频时长'),
  external_task_id: z.string().optional().describe('自定义任务ID'),
})

export class KlingImage2VideoRequestDto extends createZodDto(klingImage2VideoRequestSchema) {}

// 多图生视频请求DTO
const klingMultiImage2VideoRequestSchema = z.object({
  model_name: z.string().min(1).describe('模型名称'),
  image_list: z.array(z.any()).describe('图片列表'),
  prompt: z.string().describe('正向文本提示词'),
  negative_prompt: z.string().optional().describe('负向文本提示词'),
  mode: z.enum(Mode).optional().describe('生成视频的模式'),
  duration: z.enum(['5', '10']).optional().describe('生成视频时长'),
  aspect_ratio: z.enum(AspectRatio).optional().describe('生成图片的画面纵横比'),
  external_task_id: z.string().optional().describe('自定义任务ID'),
})

export class KlingMultiImage2VideoRequestDto extends createZodDto(klingMultiImage2VideoRequestSchema) {}

// Kling任务查询DTO
const klingTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class KlingTaskQueryDto extends createZodDto(klingTaskQuerySchema) {}

// Volcengine任务查询DTO
const volcengineTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class VolcengineTaskQueryDto extends createZodDto(volcengineTaskQuerySchema) {}

// Dashscope 文生视频请求
const dashscopeText2VideoRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  input: z.object({
    prompt: z.string().min(1).describe('正向文本提示词'),
    negative_prompt: z.string().optional().describe('负向文本提示词'),
  }),
  parameters: z.object({
    size: z.string().optional().describe('视频尺寸'),
    duration: z.number().optional().describe('视频时长（秒）'),
    prompt_extend: z.boolean().optional().describe('是否扩展提示词'),
  }).optional(),
})

export class DashscopeText2VideoRequestDto extends createZodDto(dashscopeText2VideoRequestSchema) {}

// Dashscope 图生视频请求
const dashscopeImage2VideoRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  input: z.object({
    image_url: z.string().min(1).describe('图片URL'),
    prompt: z.string().optional().describe('正向文本提示词'),
    negative_prompt: z.string().optional().describe('负向文本提示词'),
  }),
  parameters: z.object({
    resolution: z.string().optional().describe('分辨率'),
    prompt_extend: z.boolean().optional().describe('是否扩展提示词'),
  }).optional(),
})

export class DashscopeImage2VideoRequestDto extends createZodDto(dashscopeImage2VideoRequestSchema) {}

// Dashscope 首尾帧生视频请求
const dashscopeKeyFrame2VideoRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  input: z.object({
    first_frame_url: z.string().min(1).describe('首帧图片URL'),
    last_frame_url: z.string().optional().describe('尾帧图片URL'),
    prompt: z.string().optional().describe('正向文本提示词'),
    negative_prompt: z.string().optional().describe('负向文本提示词'),
    template: z.string().optional().describe('模板'),
  }),
  parameters: z.object({
    resolution: z.string().optional().describe('分辨率'),
    duration: z.number().optional().describe('视频时长（秒）'),
    prompt_extend: z.boolean().optional().describe('是否扩展提示词'),
  }).optional(),
})

export class DashscopeKeyFrame2VideoRequestDto extends createZodDto(dashscopeKeyFrame2VideoRequestSchema) {}

// Dashscope 任务查询 DTO
const dashscopeTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class DashscopeTaskQueryDto extends createZodDto(dashscopeTaskQuerySchema) {}
