import { createZodDto } from '@common/utils'
import { z } from 'zod/v4'

// MJ用户视频生成请求Schema
const userVideoGenerationRequestSchema = z.object({
  base64: z.string().optional().describe('图片base64或prompt里代入图片url'),
  mode: z.enum(['fast', 'relax']).optional().describe('生成模式'),
  prompt: z.string().min(1).max(4000).describe('url+提示词'),
  motion: z.enum(['high', 'low']).describe('动作强度'),
  video_type: z.enum(['vid_1.1_i2v_480', 'vid_1.1_i2v_720', 'vid_1.1_i2v_1080']).optional().describe('视频类型'),
  animate_mode: z.enum(['manual', 'auto']).optional().describe('动画模式'),
  action: z.enum(['rerun', 'start_frame', 'auto_low', 'auto_high', 'low_motion', 'high_motion']).optional().describe('视频执行动作'),
  taskId: z.string().optional().describe('视频衍生执行动作用到的任务id'),
  index: z.number().int().min(0).max(3).optional().describe('视频衍生索引'),
})

export class UserVideoGenerationRequestDto extends createZodDto(userVideoGenerationRequestSchema) {}

// 通用视频生成请求Schema
const userVideoGenerationSchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().optional().describe('图片URL或base64'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.any()).optional().describe('其他参数'),
})

export class UserVideoGenerationDto extends createZodDto(userVideoGenerationSchema) {}
