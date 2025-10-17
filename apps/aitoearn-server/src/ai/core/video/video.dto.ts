import { createZodDto, PaginationDtoSchema, UserType } from '@yikart/common'
import { z } from 'zod'
import { AspectRatio, CameraControlType, TaskStatus as KlingTaskStatus, Mode } from '../../libs/kling'
import { ContentType, ImageRole, TaskStatus } from '../../libs/volcengine'
// 移除了不必要的类型导入，因为现在使用zod schema

// 通用视频生成请求
const videoGenerationRequestSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('其他参数'),
})

export class VideoGenerationRequestDto extends createZodDto(videoGenerationRequestSchema) {}

// 通用视频任务状态查询
const videoTaskQuerySchema = z.object({
  taskId: z.string().min(1).describe('任务ID'),
})

export class VideoTaskQueryDto extends createZodDto(videoTaskQuerySchema) {}

// 通用视频生成请求
const userVideoGenerationRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...videoGenerationRequestSchema.shape,
})

export class UserVideoGenerationRequestDto extends createZodDto(userVideoGenerationRequestSchema) {}

// 通用视频任务状态查询
const userVideoTaskQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...videoTaskQuerySchema.shape,
})

export class UserVideoTaskQueryDto extends createZodDto(userVideoTaskQuerySchema) {}

// 通用视频任务状态查询
const listUserVideoTasksQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  ...PaginationDtoSchema.shape,
})

export class UserListVideoTasksQueryDto extends createZodDto(listUserVideoTasksQuerySchema) {}

// Kling文生视频请求
const klingText2VideoRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
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
  userId: z.string(),
  userType: z.enum(UserType),
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

// Kling回调接口DTO
const klingCallbackSchema = z.object({
  task_id: z.string().describe('任务ID'),
  task_status: z.enum(KlingTaskStatus).describe('任务状态'),
  task_status_msg: z.string().describe('任务状态信息'),
  task_info: z.object({
    parent_video: z.object({
      id: z.string().describe('续写前的视频ID'),
      url: z.string().describe('续写前视频的URL'),
      duration: z.string().describe('续写前的视频总时长，单位s'),
    }).optional(),
    external_task_id: z.string().optional().describe('客户自定义任务ID'),
  }).describe('任务创建时的参数信息'),
  created_at: z.number().describe('任务创建时间，Unix时间戳、单位ms'),
  updated_at: z.number().describe('任务更新时间，Unix时间戳、单位ms'),
  task_result: z.object({
    images: z.array(z.object({
      index: z.number().describe('图片编号'),
      url: z.string().describe('生成图片的URL'),
    })).optional().describe('图片类任务的结果'),
    videos: z.array(z.object({
      id: z.string().describe('视频ID'),
      url: z.string().describe('视频的URL'),
      duration: z.string().describe('视频总时长，单位s'),
    })).optional().describe('视频类任务的结果'),
  }).optional().describe('任务结果'),
})

export class KlingCallbackDto extends createZodDto(klingCallbackSchema) {}

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
  }).optional(),
})

export class VolcengineCallbackDto extends createZodDto(volcengineCallbackSchema) {}

// ==================== Kling API 其他接口 DTO ====================

// 图生视频请求DTO
const klingImage2VideoRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  model_name: z.string().min(1).describe('模型名称'),
  image: z.string().optional().describe('参考图像'),
  image_tail: z.string().optional().describe('参考图像 - 尾帧控制'),
  prompt: z.string().optional().describe('正向文本提示词'),
  negative_prompt: z.string().optional().describe('负向文本提示词'),
  cfg_scale: z.number().optional().describe('生成视频的自由度'),
  mode: z.enum(Mode).optional().describe('生成视频的模式'),
  static_mask: z.string().optional().describe('静态笔刷涂抹区域'),
  dynamic_masks: z.array(z.object({
    mask: z.string().optional(),
    trajectories: z.array(z.object({
      x: z.number().optional(),
      y: z.number().optional(),
    })),
  })).optional().describe('动态笔刷配置列表'),
  camera_control: z.object({
    type: z.enum(CameraControlType).optional(),
    config: z.object({
      horizontal: z.number().optional(),
      vertical: z.number().optional(),
      pan: z.number().optional(),
      tilt: z.number().optional(),
      roll: z.number().optional(),
      zoom: z.number().optional(),
    }).optional(),
  }).optional().describe('控制摄像机运动的协议'),
  duration: z.enum(['5', '10']).optional().describe('生成视频时长'),
})

export class KlingImage2VideoRequestDto extends createZodDto(klingImage2VideoRequestSchema) {}

// 多图生视频请求DTO
const klingMultiImage2VideoRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  model_name: z.string().min(1).describe('模型名称'),
  image_list: z.array(z.object({
    image: z.string(),
  })).describe('图片列表'),
  prompt: z.string().describe('正向文本提示词'),
  negative_prompt: z.string().optional().describe('负向文本提示词'),
  mode: z.enum(Mode).optional().describe('生成视频的模式'),
  duration: z.enum(['5', '10']).optional().describe('生成视频时长'),
  aspect_ratio: z.enum(AspectRatio).optional().describe('生成图片的画面纵横比'),
})

export class KlingMultiImage2VideoRequestDto extends createZodDto(klingMultiImage2VideoRequestSchema) {}

// Kling任务查询DTO
const klingTaskQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  taskId: z.string().min(1).describe('任务ID'),
})

export class KlingTaskQueryDto extends createZodDto(klingTaskQuerySchema) {}

// Volcengine任务查询DTO
const volcengineTaskQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  taskId: z.string().min(1).describe('任务ID'),
})

export class VolcengineTaskQueryDto extends createZodDto(volcengineTaskQuerySchema) {}

// ==================== Dashscope API DTO ====================

// Dashscope文生视频请求DTO
const dashscopeText2VideoRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
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

// Dashscope图生视频请求DTO
const dashscopeImage2VideoRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
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

// Dashscope首尾帧生视频请求DTO
const dashscopeKeyFrame2VideoRequestSchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
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

// Dashscope回调DTO
const dashscopeCallbackSchema = z.object({
  status_code: z.number().describe('HTTP状态码'),
  request_id: z.string().describe('请求ID'),
  code: z.string().nullable().describe('错误码'),
  message: z.string().describe('错误消息'),
  output: z.object({
    task_id: z.string().describe('任务ID'),
    task_status: z.string().describe('任务状态'),
    video_url: z.string().optional().describe('视频URL'),
    submit_time: z.string().optional().describe('任务提交时间'),
    scheduled_time: z.string().optional().describe('任务调度时间'),
    end_time: z.string().optional().describe('任务结束时间'),
    orig_prompt: z.string().optional().describe('原始提示词'),
    actual_prompt: z.string().optional().describe('实际使用的提示词'),
  }).describe('输出结果'),
  usage: z.object({
    video_count: z.number().describe('视频数量'),
    video_duration: z.number().describe('视频时长'),
    video_ratio: z.string().describe('视频分辨率'),
  }).nullable().optional().describe('使用量统计'),
})

export class DashscopeCallbackDto extends createZodDto(dashscopeCallbackSchema) {}

// Dashscope任务查询DTO
const dashscopeTaskQuerySchema = z.object({
  userId: z.string(),
  userType: z.enum(UserType),
  taskId: z.string().min(1).describe('任务ID'),
})

export class DashscopeTaskQueryDto extends createZodDto(dashscopeTaskQuerySchema) {}

// 视频生成模型查询DTO
const videoGenerationModelsQuerySchema = z.object({
  userId: z.string().optional().describe('用户ID'),
  userType: z.enum(UserType).optional().describe('用户类型'),
})

export class VideoGenerationModelsQueryDto extends createZodDto(videoGenerationModelsQuerySchema) {}
