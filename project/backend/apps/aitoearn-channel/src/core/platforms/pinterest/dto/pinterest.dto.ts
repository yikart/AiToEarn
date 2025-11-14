import { createZodDto } from '@yikart/common'
import { z } from 'zod'
import { Country, Currency, SourceType } from '../../../../libs/pinterest/common'

const CreateAccountBodySchema = z.object({
  country: z.nativeEnum(Country).optional().describe('国家'),
  currency: z.nativeEnum(Currency).optional().describe('货币'),
  name: z.string().optional().describe('名称'),
  owner_user_id: z.string().optional().describe('所属用户'),
})
export class CreateAccountBodyDto extends createZodDto(CreateAccountBodySchema) {}

const CreateBoardBodySchema = z.object({
  name: z.string().describe('名称'),
  accountId: z.string().optional().describe('用户ID'),
})
export class CreateBoardBodyDto extends createZodDto(CreateBoardBodySchema) {}

const MediaSourceSchema = z.object({
  source_type: z.nativeEnum(SourceType).describe('媒体类型'),
  cover_image_url: z.string().optional().describe('封面地址'),
  url: z.string().optional().describe('图片或者视频地址'),
})
export class MediaSourceDto extends createZodDto(MediaSourceSchema) {}

const CreatePinBodyItemSchema = z.object({
  url: z.string().optional().describe('地址'),
  title: z.string().optional().describe('标题'),
  description: z.string().optional().describe('描述'),
  link: z.string().optional().describe('链接'),
})
export class CreatePinBodyItemDto extends createZodDto(CreatePinBodyItemSchema) {}

const CreatePinBodySchema = z.object({
  board_id: z.string().describe('此 Pin 所属的板块'),
  accountId: z.string().optional().describe('用户ID'),
  link: z.string().optional().describe('点击链接'),
  title: z.string().optional().describe('标题'),
  description: z.string().optional().describe('描述'),
  dominant_color: z.string().optional().describe('主引脚颜色'),
  alt_text: z.string().optional().describe('alt_text'),
  media_source: MediaSourceSchema.describe('媒体来源'),
  url: z.string().optional().describe('地址'),
  items: z.array(CreatePinBodyItemSchema).optional().describe('媒体来源列表'),
})
export class CreatePinBodyDto extends createZodDto(CreatePinBodySchema) {}

const WebhookSchema = z.object({
  code: z.string().optional().describe('code'),
  state: z.string().optional().describe('state'),
})
export class WebhookDto extends createZodDto(WebhookSchema) {}
