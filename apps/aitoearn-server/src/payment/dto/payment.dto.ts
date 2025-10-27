import { createZodDto } from '@yikart/common'
import { CloudSpaceRegion } from '@yikart/mongodb'
import { z } from 'zod'

const LineItemsSchema = z.object({
  price: z.string().describe('价格id'),
  quantity: z.number().int().describe('数量'),
})

export class LineItemsDto extends createZodDto(LineItemsSchema) { }

const MetadataSchema = z.object({
  userId: z.string().optional().describe('userId'),
})

export class MetadataDto extends createZodDto(MetadataSchema) { }

const SubscriptionDataSchema = z.object({
  trial_period_days: z.number().int().optional().describe('免费试用天数'),
})

export class SubscriptionDataDto extends createZodDto(SubscriptionDataSchema) { }

export const CheckoutBodySchema = z.object({
  id: z.string().optional().describe('订单id'),
  success_url: z.string().optional().describe('默认回到域名首页，如果指定回调页面只需要加上域名后面path地址即可'),
  payment: z.string().describe('付款模式-连续包月-连续包年-一次性付-购买积分'),
  mode: z.string().describe('支付模式'),
  quantity: z.number().optional().default(1).describe('购买的积分数目，如果payment是必须填写'),
  flagTrialPeriodDays: z.number().optional().default(0).describe('订阅模式下是否给七天免费试用时长， 0 - 不给，   1-给'),
  metadata: MetadataSchema.optional().describe('aitoearn订单信息'),
})

export class CheckoutBodyDto extends createZodDto(CheckoutBodySchema) { }

export const DiscountsSchema = z.object({
  coupon: z.string().optional().describe('优惠券id'),
  promotion_code: z.string().optional().describe('促销代码'),
})

export class DiscountsDto extends createZodDto(DiscountsSchema) { }

export const ChargeInfoSchema = z.object({
  payment_status: z.string().describe('支付状态'),
})

export class ChargeInfoDto extends createZodDto(ChargeInfoSchema) { }

export const CheckoutSchema = z.object({
  userId: z.string().describe('成功的回调地址'),
  mode: z.string().optional().describe('订单模式'),
  quantity: z.number().optional().describe('购买的积分数目，如果payment是必须填写'),
  status: z.number().optional().describe('订单状态'),
  metadata: z.any().optional().describe('aitoearn订单信息'),
  discounts: z.array(DiscountsSchema).optional().describe('优惠券参数'),
  chargeInfo: ChargeInfoSchema.optional().describe('stripe推来付款订单详情'),
})

export class CheckoutDto extends createZodDto(CheckoutSchema) { }

export const RefundSchema = z.object({
  id: z.string().optional().describe('退款id'),
  payment_intent: z.string().optional().describe('结账id'),
  metadata: z.object({}).optional().describe('退款元数据'),
  amount: z.number().optional().describe('退款金额'),
  price_data: z.object({}).optional().describe('退款金额信息'),
})

export class RefundDto extends createZodDto(RefundSchema) { }

export const CheckoutListBodySchema = z.object({
  userId: z.string().optional().describe('userId'),
  page: z.number().optional().describe('页面'),
  size: z.number().optional().describe('每页个数'),
})

export class CheckoutListBody extends createZodDto(CheckoutListBodySchema) { }

export const RefundBodySchema = z.object({
  charge: z.string().optional().describe('checkout表里面的charge'),
  payment_intent: z.string().optional().describe('checkout表里面的chargeId'),
  userId: z.string().optional().describe('userId'),
})

export class RefundBodyDto extends createZodDto(RefundBodySchema) { }

export const SubscriptionBodySchema = z.object({
  page: z.number().optional().describe('页面'),
  size: z.number().optional().describe('每页个数'),
  userId: z.string().optional().describe('userId'),
})

export class SubscriptionBodyDto extends createZodDto(SubscriptionBodySchema) { }

export const WebhookDataSchema = z.object({
  object: z.object({}).optional().describe('object'),
})

export class WebhookDataDto extends createZodDto(WebhookDataSchema) { }

export const WebhookSchema = z.object({
  type: z.string().describe('事件类型'),
  id: z.string().describe('id'),
  body: z.object({}).describe('原本的请求体'),
  data: WebhookDataSchema.describe('事件内容'),
  created: z.number().describe('事件发生时间'),
})

export class WebhookDto extends createZodDto(WebhookSchema) { }

export const UnSubscriptionBodySchema = z.object({
  id: z.string().optional().describe('订阅id'),
  userId: z.string().optional().describe('userId'),
})

export class UnSubscriptionBodyDto extends createZodDto(UnSubscriptionBodySchema) { }

export interface ICreateCloudSpace {
  userId?: string
  accountGroupName?: string
  accountGroupId?: string
  region: CloudSpaceRegion
  profileName?: string
  month?: number
}

export interface ICreateCloudSpace {
  userId?: string
  accountGroupName?: string
  accountGroupId?: string
  region: CloudSpaceRegion
  profileName?: string
  month?: number
}
