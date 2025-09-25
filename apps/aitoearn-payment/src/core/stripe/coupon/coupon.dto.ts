import { IDuration } from '@yikart/stripe'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Expose } from 'class-transformer'
import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator'

export class CouponDto {
  @IsString({ message: '优惠券有效期限' })
  @Expose()
  readonly duration: IDuration

  @IsInt({ message: '折扣-  ps:20 指的是8折' })
  @Expose()
  readonly percent_off: number
}

export class ListCouponDto {
  @IsInt({ message: '页码' })
  @IsOptional()
  @Expose()
  readonly page?: number

  @IsInt({ message: '每页大小' })
  @IsOptional()
  @Expose()
  readonly size?: number
}
