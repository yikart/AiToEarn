/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Expose } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'

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
  @Expose()
  readonly amount: number
}

export class RefundBodyDto {
  @IsString({ message: 'checkout表里面的charge id' })
  @IsOptional()
  @Expose()
  readonly charge: string

  @IsString({ message: 'userId' })
  @IsOptional()
  @Expose()
  readonly userId?: string

  @IsBoolean({ message: '是否是管理员' })
  @IsOptional()
  @Expose()
  readonly isAdmin?: boolean
}
