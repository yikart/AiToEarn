import { ICheckoutMode, IFlagTrialPeriodDays, IPayment } from '@yikart/stripe'
import { Expose, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

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

  @IsString({ message: 'payment' })
  @IsOptional()
  @Expose()
  readonly payment?: IPayment

  @IsString({ message: 'mode' })
  @IsOptional()
  @Expose()
  readonly mode?: ICheckoutMode
}

export class SubscriptionDataDto {
  @IsInt({ message: '免费试用天数' })
  @IsOptional()
  @Expose()
  readonly trial_period_days?: number
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

export class CheckoutBodyDto {
  @IsString({ message: '订单id' })
  @Expose()
  @IsOptional()
  readonly id: string

  @IsString({ message: '成功的回调地址' })
  @Expose()
  @IsOptional()
  readonly success_url: string

  @IsString({ message: '付款模式-连续包月-连续包年-一次性付 购买积分' })
  @Expose()
  @IsOptional()
  readonly payment: IPayment

  @IsNumber({}, { message: '购买的积分数目，如果payment是必须填写' })
  @Expose()
  @IsOptional()
  readonly quantity: number = 1

  @IsString({ message: '支付模式' })
  @Expose()
  @IsOptional()
  readonly mode: ICheckoutMode

  @IsNumber({}, { message: '订阅模式下是否给七天免费试用时长， 0 - 不给，   1-给' })
  @Expose()
  @IsOptional()
  readonly flagTrialPeriodDays: IFlagTrialPeriodDays = IFlagTrialPeriodDays.false

  @ValidateNested()
  @Type(() => MetadataDto)
  @Expose()
  @IsOptional()
  readonly metadata: MetadataDto

  @ValidateNested()
  @Type(() => DiscountsDto)
  @Expose()
  @IsOptional()
  readonly discounts: DiscountsDto[] = []
}

export class CheckoutDto {
  @IsString({ message: '成功的回调地址' })
  @Expose()
  @IsOptional()
  readonly success_url: string

  @IsString({ message: '订单模式' })
  @Expose()
  @IsOptional()
  readonly mode: ICheckoutMode

  @IsArray({ message: '订单列表' })
  @Expose()
  @IsOptional()
  readonly line_items: LineItemsDto[]

  @ValidateNested()
  @Type(() => MetadataDto)
  @Expose()
  @IsOptional()
  readonly metadata: MetadataDto

  @IsBoolean({ message: 'allow_promotion_codes' })
  @Expose()
  @IsOptional()
  readonly allow_promotion_codes: boolean

  @ValidateNested()
  @Type(() => SubscriptionDataDto)
  @Expose()
  @IsOptional()
  readonly subscription_data?: SubscriptionDataDto

  @ValidateNested()
  @Type(() => DiscountsDto)
  @Expose()
  @IsOptional()
  readonly discounts: DiscountsDto[] = []
}
