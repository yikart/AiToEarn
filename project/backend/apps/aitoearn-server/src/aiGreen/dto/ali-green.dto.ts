import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const TextBodySchema = z.object({
  content: z.string().describe('文本内容'),
})
export class TextBodyDto extends createZodDto(TextBodySchema) {}

const ImageBodySchema = z.object({
  imageUrl: z.string().describe('图片地址'),
})
export class ImageBodyDto extends createZodDto(ImageBodySchema) {}

const VideoBodySchema = z.object({
  url: z.string().describe('视频地址'),
})
export class VideoBodyDto extends createZodDto(VideoBodySchema) {}

const VideoResultBodySchema = z.object({
  taskId: z.string().describe('视频任务id'),
})
export class VideoResultBodyDto extends createZodDto(VideoResultBodySchema) {}
