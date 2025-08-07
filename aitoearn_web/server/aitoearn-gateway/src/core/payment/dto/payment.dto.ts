import { ApiProperty } from '@nestjs/swagger'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Expose, Type } from 'class-transformer'
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import {
  ICheckoutMode,
  ICheckoutStatus,
  IMetadata,
  IPayment,
  IWebhookType,
} from '../../../transports/payment/comment'

export class LineItemsDto {
  @IsString({ message: '价格id' })
  @Expose()
  readonly price: string

  @IsInt({ message: '数量' })
  @Expose()
  readonly quantity: number
}

export class MetadataDto {
  @IsString({ message: 'userId' })
  @IsOptional()
  @Expose()
  readonly userId?: string
}

export class SubscriptionDataDto {
  @IsInt({ message: '免费试用天数' })
  @IsOptional()
  @Expose()
  readonly trial_period_days?: number
}

export class CheckoutBodyDto {
  @IsString({ message: '订单id' })
  @Expose()
  @IsOptional()
  id: string

  @ApiProperty({ title: '默认回到域名首页，如果指定回调页面只需要加上域名后面path地址即可', required: false })
  @IsString({ message: '成功的回调地址' })
  @IsOptional()
  @Expose()
  success_url: string

  @ApiProperty({ title: '付款模式-连续包月-连续包年-一次性付', enum: IPayment })
  @IsString({ message: '付款模式-连续包月-连续包年-一次性付' })
  @Expose()
  readonly payment: IPayment

  @ApiProperty({ title: '支付模式', enum: ICheckoutMode })
  @IsString({ message: '支付模式' })
  @Expose()
  readonly mode: ICheckoutMode

  @ApiProperty({ title: 'aitoearn订单信息', required: false })
  @ValidateNested()
  @Type(() => MetadataDto)
  @Expose()
  @IsOptional()
  metadata: MetadataDto
}
export class DiscountsDto {
  @IsString({ message: '优惠券id' })
  @IsOptional()
  @Expose()
  readonly coupon?: string
}

export class CheckoutDto {
  @IsString({ message: '成功的回调地址' })
  @Expose()
  @IsOptional()
  readonly userId: string

  @IsString({ message: '订单模式' })
  @Expose()
  @IsOptional()
  readonly mode: ICheckoutMode

  @IsInt({ message: '订单状态' })
  @Expose()
  @IsOptional()
  readonly status: ICheckoutStatus

  @IsObject({ message: 'aitoearn订单信息' })
  @Expose()
  @IsOptional()
  readonly metadata: IMetadata

  @ApiProperty({ title: '优惠券参数', required: false })
  @ValidateNested()
  @Type(() => DiscountsDto)
  @Expose()
  @IsOptional()
  readonly discounts?: DiscountsDto[]
}

export class RefundDto {
  @IsString({ message: '退款id' })
  @IsOptional()
  @Expose()
  readonly id: string

  @IsString({ message: '结账id' })
  @IsOptional()
  @Expose()
  readonly payment_intent: string

  @IsObject({ message: '退款元数据' })
  @Expose()
  @IsOptional()
  readonly metadata: object

  @IsInt({ message: '退款金额' })
  @IsOptional()
  @Expose()
  readonly amount: number

  @IsObject({ message: '退款金额信息' })
  @IsOptional()
  @Expose()
  readonly price_data: object
}

export class CheckoutListBody {
  @IsString({ message: 'userId' })
  @IsOptional()
  @Expose()
  readonly userId: string

  @ApiProperty({ title: '页面', required: false })
  @IsInt({ message: '页面' })
  @IsOptional()
  @Expose()
  readonly page: number

  @ApiProperty({ title: '每页个数', required: false })
  @IsInt({ message: '每页个数' })
  @IsOptional()
  @Expose()
  readonly size: number
}

export class RefundBodyDto {
  @ApiProperty({ title: 'checkout表里面的charge ', required: true })
  @IsString({ message: 'checkout表里面的charge' })
  @IsOptional()
  @Expose()
  readonly charge: string

  @IsString({ message: 'checkout表里面的chargeId' })
  @IsOptional()
  @Expose()
  readonly payment_intent?: string

  @IsString({ message: 'userId' })
  @IsOptional()
  @Expose()
  readonly userId?: string
}

export class SubscriptionBodyDto {
  @ApiProperty({ title: '页面' })
  @IsInt({ message: '页面' })
  @IsOptional()
  @Expose()
  readonly page?: number

  @ApiProperty({ title: '每页个数' })
  @IsInt({ message: '每页个数' })
  @IsOptional()
  @Expose()
  readonly size?: number

  @IsString({ message: 'userId' })
  @IsOptional()
  @Expose()
  readonly userId?: string
}

export class WebhookDataDto {
  @IsObject({ message: 'object' })
  @IsOptional()
  @Expose()
  readonly object: any
}

export class WebhookDto {
  @IsString({ message: '事件类型' })
  @Expose()
  readonly type: IWebhookType

  @IsString({ message: 'id' })
  @Expose()
  readonly id: string

  @IsObject({ message: '原本的请求体' })
  @Expose()
  readonly body: object

  @IsObject({ message: '事件内容' })
  @Expose()
  readonly data: WebhookDataDto

  @IsNumber({ allowNaN: false }, { message: '事件发生时间' })
  @Expose()
  readonly created: number
}

export class UnSubscriptionBodyDto {
  @ApiProperty({ title: '订阅id' })
  @IsString({ message: '订阅id' })
  @Expose()
  readonly id?: string

  @IsString({ message: 'userId' })
  @IsOptional()
  @Expose()
  readonly userId?: string
}
