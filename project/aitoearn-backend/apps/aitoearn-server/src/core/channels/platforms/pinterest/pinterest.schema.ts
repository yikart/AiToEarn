import { z } from 'zod'

export enum PinterestBoardPrivacy {
  Public = 'PUBLIC',
  Protected = 'PROTECTED',
  Secret = 'SECRET',
}

export const PinterestBoardCreateSchema = z.object({
  name: z.string().min(1).describe('画板名称'),
  description: z.string().optional().describe('画板描述'),
  privacy: z.enum(PinterestBoardPrivacy).optional().describe('画板隐私级别'),
})

export const PinterestOptionSchema = z.object({
  boardId: z.string().min(1).describe('画板 ID'),
  link: z.httpUrl().optional().describe('Pin 跳转链接'),
  altText: z.string().max(500).optional().describe('替代文本'),
  coverImageUrl: z.httpUrl().optional().describe('视频 Pin 封面 URL'),
})

export type PinterestBoardCreate = z.infer<typeof PinterestBoardCreateSchema>

export type PinterestOption = z.infer<typeof PinterestOptionSchema>
