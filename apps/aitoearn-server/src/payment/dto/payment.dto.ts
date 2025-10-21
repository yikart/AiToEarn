import { ApiProperty } from '@nestjs/swagger'
import { CloudSpaceRegion } from '@yikart/cloud-space-client/src/cloud-space.interfaces'
import { Expose, Type } from 'class-transformer'
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { ICheckoutMode, ICheckoutStatus, IFlagTrialPeriodDays, IMetadata, IPayment, IPaymentStatus, IWebhookType } from '../api/comment'

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

  @ApiProperty({ title: '付款模式-连续包月-连续包年-一次性付-购买积分', enum: IPayment })
  @IsString({ message: '付款模式-连续包月-连续包年-一次性付' })
  @Expose()
  readonly payment: IPayment

  @ApiProperty({ title: '支付模式', enum: ICheckoutMode })
  @IsString({ message: '支付模式' })
  @Expose()
  readonly mode: ICheckoutMode

  @IsNumber({}, { message: '购买的积分数目，如果payment是必须填写' })
  @Expose()
  @IsOptional()
  readonly quantity: number = 1

  @ApiProperty({ title: '订阅模式下是否给七天免费试用时长， 0 - 不给，   1-给', enum: IFlagTrialPeriodDays })
  @IsNumber({}, { message: '订阅模式下是否给七天免费试用时长， 0 - 不给，   1-给' })
  @Expose()
  @IsOptional()
  flagTrialPeriodDays: IFlagTrialPeriodDays = IFlagTrialPeriodDays.false

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

  @IsString({ message: '促销代码' })
  @IsOptional()
  @Expose()
  readonly promotion_code?: string
}

export class ChargeInfoDto {
  payment_status: IPaymentStatus
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

  @IsNumber({}, { message: '购买的积分数目，如果payment是必须填写' })
  @Expose()
  @IsOptional()
  readonly quantity: number

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

  @IsObject({ message: 'stripe推来付款订单详情' })
  @Expose()
  @IsOptional()
  readonly chargeInfo?: ChargeInfoDto
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

export interface ICreateCloudSpace {
  userId?: string
  accountGroupName?: string
  accountGroupId?: string
  region: CloudSpaceRegion
  profileName?: string
  month?: number
}
