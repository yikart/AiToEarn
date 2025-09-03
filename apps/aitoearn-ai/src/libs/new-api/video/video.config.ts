import { createZodDto } from '@yikart/common'
import { z } from 'zod'

/**
 * 视频API配置Schema
 */
export const videoConfigSchema = z.object({
  baseURL: z.string().describe('视频API Base URL'),
  timeout: z.number().default(300000).describe('请求超时时间（毫秒）'),
})

/**
 * 视频API配置类
 */
export class VideoConfig extends createZodDto(videoConfigSchema) {}
