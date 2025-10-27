import { createZodDto } from '@yikart/common'
import z from 'zod'
import { Country, Currency, SourceType } from '../../../libs/pinterest/common'

const CreateAccountBodySchema = z.object({
  country: z.enum(Country).optional(),
  currency: z.enum(Currency).optional(),
  name: z.string().optional(),
  owner_user_id: z.string().optional(),
})

export class CreateAccountBodyDto extends createZodDto(CreateAccountBodySchema) { }

const CreateBoardBodySchema = z.object({
  name: z.string({ message: '名称' }),
  accountId: z.string().optional(),
})

export class CreateBoardBodyDto extends createZodDto(CreateBoardBodySchema) { }

const MediaSourceSchema = z.object({
  source_type: z.enum(SourceType, { message: '媒体类型' }),
  cover_image_url: z.string().optional(),
  url: z.string().optional(),
})

export class MediaSource extends createZodDto(MediaSourceSchema) { }

const CreatePinBodyItemSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  link: z.string().optional(),
})

export class CreatePinBodyItemDto extends createZodDto(CreatePinBodyItemSchema) { }

const CreatePinBodySchema = z.object({
  board_id: z.string({ message: '此 Pin 所属的板块。' }),
  accountId: z.string().optional(),
  link: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  dominant_color: z.string().optional(),
  alt_text: z.string().optional(),
  media_source: z.any().optional(), // 使用z.any()因为MediaSource是自定义对象
  url: z.string().optional(),
  items: z.array(CreatePinBodyItemSchema).optional(),
})

export class CreatePinBodyDto extends createZodDto(CreatePinBodySchema) {}

const WebhookSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
})

export class WebhookDto extends createZodDto(WebhookSchema) {}
