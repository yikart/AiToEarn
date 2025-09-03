import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { FireflycardTempTypes } from '@/libs'

// 消息内容类型定义
const messageContentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().describe('文本内容'),
  }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({
      url: z.url().describe('图片链接'),
      detail: z.enum(['auto', 'low', 'high']).optional().describe('图片处理质量'),
    }),
  }),
  z.object({
    type: z.literal('video_url'),
    video_url: z.object({
      url: z.url().describe('视频链接'),
    }),
  }),
  z.object({
    type: z.literal('input_audio'),
    input_audio: z.object({
      data: z.url().describe('音频链接'),
      format: z.string(),
    }),
  }),
])

// 聊天消息定义
const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']).describe('消息角色'),
  content: z.string().or(z.array(messageContentSchema)).describe('消息内容'),
})

// 用户AI聊天请求
const userAiChatSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  messages: z.array(chatMessageSchema).min(1).describe('消息列表'),
  model: z.string().describe('AI模型'),
  temperature: z.number().min(0).max(2).optional().describe('温度参数'),
  maxTokens: z.number().int().min(1).optional().describe('最大输出token数'),
})

export class UserAiChatDto extends createZodDto(userAiChatSchema) {}

// 用户使用统计查询
const userUsageQuerySchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  startTime: z.number().optional().describe('开始时间戳'),
  endTime: z.number().optional().describe('结束时间戳'),
})

export class UserUsageQueryDto extends createZodDto(userUsageQuerySchema) {}

// 用户日志查询
const userLogsQuerySchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  page: z.number().int().min(1).optional().describe('页码，默认1'),
  size: z.number().int().min(1).max(100).optional().describe('每页数量，默认10，最大100'),
  start_timestamp: z.number().int().optional().describe('开始时间戳'),
  end_timestamp: z.number().int().optional().describe('结束时间戳'),
  model_name: z.string().optional().describe('模型名称'),
})

export class UserLogsQueryDto extends createZodDto(userLogsQuerySchema) {}

// 用户图片生成请求
const userImageGenerationSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  prompt: z.string().min(1).max(4000).describe('图片描述提示'),
  model: z.string().describe('图片生成模型'),
  n: z.number().int().min(1).max(10).optional().describe('生成图片数量'),
  quality: z.string().optional().describe('图片质量'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  size: z.string().optional().describe('图片尺寸'),
  style: z.string().optional().describe('图片风格'),
  user: z.string().optional().describe('用户标识符'),
})

export class UserImageGenerationDto extends createZodDto(userImageGenerationSchema) {}

// 用户图片编辑请求
const userImageEditSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  image: z.string().describe('原始图片（base64编码）'),
  prompt: z.string().min(1).max(4000).describe('编辑描述'),
  mask: z.string().optional().describe('遮罩图片（base64编码）'),
  model: z.string().describe('图片编辑模型'),
  n: z.number().int().min(1).max(10).optional().describe('生成图片数量'),
  size: z.string().optional().describe('图片尺寸'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  user: z.string().optional().describe('用户标识符'),
})

export class UserImageEditDto extends createZodDto(userImageEditSchema) {}

// 用户图片变体请求
const userImageVariationSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  image: z.string().describe('原始图片（base64编码）'),
  model: z.string().describe('图片模型'),
  n: z.number().int().min(1).max(10).optional().describe('生成图片数量'),
  size: z.string().optional().describe('图片尺寸'),
  response_format: z.enum(['url', 'b64_json']).optional().describe('返回格式'),
  user: z.string().optional().describe('用户标识符'),
})

export class UserImageVariationDto extends createZodDto(userImageVariationSchema) {}

// 用户视频生成请求
const userMJVideoGenerationSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
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

export class UserMJVideoGenerationDto extends createZodDto(userMJVideoGenerationSchema) {}

// 视频任务状态查询
const userMJTaskStatusQuerySchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  taskId: z.string().min(1).describe('任务ID'),
})

export class UserMJTaskStatusQueryDto extends createZodDto(userMJTaskStatusQuerySchema) {}

// 通用视频生成请求
const userVideoGenerationRequestSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  model: z.string().min(1).describe('模型名称'),
  prompt: z.string().min(1).max(4000).describe('提示词'),
  image: z.string().optional().describe('图片URL或base64'),
  image_tail: z.string().optional().describe('尾帧图片URL或base64'),
  mode: z.string().optional().describe('生成模式'),
  size: z.string().optional().describe('尺寸'),
  duration: z.number().optional().describe('时长'),
  metadata: z.record(z.string(), z.any()).optional().describe('其他参数'),
})

export class UserVideoGenerationRequestDto extends createZodDto(userVideoGenerationRequestSchema) {}

// 通用视频任务状态查询
const userVideoTaskQuerySchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  taskId: z.string().min(1).describe('任务ID'),
})

export class UserVideoTaskQueryDto extends createZodDto(userVideoTaskQuerySchema) {}

// 视频生成价格查询
const videoGenerationPriceQuerySchema = z.object({
  model: z.string().min(1).describe('模型名称'),
  duration: z.number().optional().describe('时长'),
  size: z.string().optional().describe('尺寸'),
  mode: z.string().optional().describe('生成模式'),
})

export class VideoGenerationPriceQueryDto extends createZodDto(videoGenerationPriceQuerySchema) {}

// MD2Card生成请求
const md2CardGenerationSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  markdown: z.string().describe('要转换的 Markdown 文本'),
  theme: z.string().default('apple-notes').optional().describe('卡片主题样式 ID'),
  themeMode: z.string().optional().describe('主题的模式 ID'),
  width: z.number().int().min(100).max(2000).default(440).optional().describe('卡片宽度（像素）'),
  height: z.number().int().min(100).max(3000).default(586).optional().describe('卡片高度（像素）'),
  splitMode: z.string().default('noSplit').optional().describe('分割模式'),
  mdxMode: z.boolean().default(false).optional().describe('是否启用 MDX 模式'),
  overHiddenMode: z.boolean().default(false).optional().describe('是否启用溢出隐藏模式'),
})

export class Md2CardGenerationDto extends createZodDto(md2CardGenerationSchema) {}

// Fireflycard模板类型枚举
const fireflycardTempSchema = z.enum(FireflycardTempTypes)

// Fireflycard样式配置
const fireflycardStyleSchema = z.object({
  align: z.string().optional().describe('对齐方式'),
  backgroundName: z.string().optional().describe('背景名称'),
  backShadow: z.string().optional().describe('背景阴影'),
  font: z.string().optional().describe('字体'),
  width: z.number().optional().describe('宽度'),
  ratio: z.string().optional().describe('比例'),
  height: z.number().optional().describe('高度'),
  fontScale: z.number().optional().describe('字体缩放'),
  padding: z.string().optional().describe('内边距'),
  borderRadius: z.string().optional().describe('边框圆角'),
  color: z.string().optional().describe('颜色'),
  opacity: z.number().optional().describe('透明度'),
  blur: z.number().optional().describe('模糊度'),
  backgroundAngle: z.string().optional().describe('背景角度'),
  lineHeights: z.object({
    content: z.string().optional().describe('内容行高'),
  }).optional().describe('行高设置'),
  letterSpacings: z.object({
    content: z.string().optional().describe('内容字间距'),
  }).optional().describe('字间距设置'),
}).optional()

// Fireflycard开关配置
const fireflycardSwitchConfigSchema = z.object({
  showIcon: z.boolean().optional().describe('显示图标'),
  showDate: z.boolean().optional().describe('显示日期'),
  showTitle: z.boolean().optional().describe('显示标题'),
  showContent: z.boolean().optional().describe('显示内容'),
  showAuthor: z.boolean().optional().describe('显示作者'),
  showTextCount: z.boolean().optional().describe('显示文字计数'),
  showQRCode: z.boolean().optional().describe('显示二维码'),
  showPageNum: z.boolean().optional().describe('显示页码'),
  showWatermark: z.boolean().optional().describe('显示水印'),
}).optional()

// Fireflycard生成请求
const fireflycardGenerationSchema = z.object({
  userId: z.string().min(1).describe('用户ID'),
  content: z.string().min(1).describe('卡片内容'),
  temp: fireflycardTempSchema.default(FireflycardTempTypes.A).describe('模板类型'),
  title: z.string().optional().describe('标题'),
  style: fireflycardStyleSchema.describe('样式配置'),
  switchConfig: fireflycardSwitchConfigSchema.describe('开关配置'),
})

export class FireflycardGenerationDto extends createZodDto(fireflycardGenerationSchema) {}
