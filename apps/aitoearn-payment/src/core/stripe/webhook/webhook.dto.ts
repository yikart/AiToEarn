/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */

import { ICheckoutMode } from '@yikart/stripe'
import { Expose, Type } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { MetadataDto } from '../checkout/checkout.dto'
import { IWebhookType } from './comment'

export class DataDto {
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

  @IsObject({ message: '事件内容' })
  @Expose()
  readonly data: DataDto

  @IsNumber({ allowNaN: false }, { message: '事件发生时间' })
  @Expose()
  readonly created: number
}

// amount,amount_refunded,id,paid,refunded

export class ChargeDto {
  @IsString({ message: 'id' })
  @Expose()
  readonly id: string

  @IsInt({ message: '总金额' })
  @Expose()
  readonly amount: number

  @IsInt({ message: '已退款金额' })
  @Expose()
  readonly amount_refunded: number

  @IsBoolean({ message: '是否付款' })
  @Expose()
  readonly paid: boolean

  @IsBoolean({ message: '是否已退款' })
  @Expose()
  readonly refunded: boolean

  @IsString({ message: 'payment_intent' })
  @Expose()
  readonly payment_intent?: string
}

export class WebhookCheckoutDto {
  @IsString({ message: 'id' })
  @Expose()
  readonly id: string

  @IsString({ message: 'payment_intent' })
  @Expose()
  readonly payment_intent: string

  @IsString({ message: 'subscription' })
  @Expose()
  readonly subscription: string

  @IsString({ message: '付款模式' })
  @Expose()
  readonly mode: ICheckoutMode

  @IsNumber({ allowNaN: false }, { message: '事件发生时间' })
  @Expose()
  readonly eventCreated: number

  @ValidateNested()
  @Type(() => MetadataDto)
  @Expose()
  @IsOptional()
  readonly metadata: MetadataDto

  @IsNumber({}, { message: 'subscription' })
  @Expose()
  readonly amount_total: number
}
