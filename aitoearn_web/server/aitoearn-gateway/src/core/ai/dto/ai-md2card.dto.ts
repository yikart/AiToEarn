import { createZodDto } from '@common/utils/zod-dto.util'
import { z } from 'zod/v4'

// MD2Card生成请求Schema
const md2CardRequestSchema = z.object({
  markdown: z.string().default('# 默认 markdown').describe('要转换的 Markdown 文本'),
  theme: z.string().default('apple-notes').describe('卡片主题样式 ID'),
  themeMode: z.string().optional().describe('主题的模式 ID'),
  width: z.number().int().min(100).max(2000).default(440).describe('卡片宽度（像素）'),
  height: z.number().int().min(100).max(3000).default(586).describe('卡片高度（像素）'),
  splitMode: z.string().default('noSplit').describe('分割模式'),
  mdxMode: z.boolean().default(false).describe('是否启用 MDX 模式'),
  overHiddenMode: z.boolean().default(false).describe('是否启用溢出隐藏模式'),
})

export class Md2CardRequestDto extends createZodDto(md2CardRequestSchema) {}
