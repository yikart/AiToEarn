import { createZodDto } from '@common/utils/zod-dto.util'
import { z } from 'zod/v4'

// Fireflycard模板类型枚举
const fireflycardTempSchema = z.enum([
  'tempA', // 默认
  'tempB', // 书摘
  'tempC', // 透明
  'tempJin', // 金句
  'tempMemo', // 备忘录
  'tempEasy', // 便当
  'tempBlackSun', // 黑日
  'tempE', // 框界
  'tempWrite', // 手写
  'code', // 代码
  'tempD', // 图片(暂时不用)
])

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

// Fireflycard生成请求Schema
const fireflycardRequestSchema = z.object({
  content: z.string().min(1).describe('卡片内容'),
  temp: fireflycardTempSchema.default('tempA').describe('模板类型'),
  title: z.string().optional().describe('标题'),
  style: fireflycardStyleSchema.describe('样式配置'),
  switchConfig: fireflycardSwitchConfigSchema.describe('开关配置'),
})

export class FireflycardRequestDto extends createZodDto(fireflycardRequestSchema) {}
