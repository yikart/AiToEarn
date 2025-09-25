import { ICheckoutMode, IPayment } from '@yikart/stripe'
import { Expose, Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */

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

export class CheckoutBodyDto {
  @IsString({ message: '订单id' })
  @Expose()
  @IsOptional()
  readonly id: string

  @IsString({ message: '成功的回调地址' })
  @Expose()
  @IsOptional()
  readonly success_url: string

  @IsString({ message: '付款模式-连续包月-连续包年-一次性付' })
  @Expose()
  @IsOptional()
  readonly payment: IPayment

  @IsString({ message: '支付模式' })
  @Expose()
  @IsOptional()
  readonly mode: ICheckoutMode

  @ValidateNested()
  @Type(() => MetadataDto)
  @Expose()
  @IsOptional()
  readonly metadata: MetadataDto
}

export class SubscriptionDto {
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
}

export class UnsubscribeDto {
  @IsString({ message: '取消订阅id' })
  @Expose()
  @IsOptional()
  readonly id: string

  @IsString({ message: 'userId' })
  @Expose()
  @IsOptional()
  readonly userId?: string
}
