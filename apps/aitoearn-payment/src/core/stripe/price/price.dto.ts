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

export class ProductDataDto {
  @IsString({ message: '关联的产品名称产品' })
  @Expose()
  readonly name: string
}

export class PriceDto {
  @IsString({ message: '货币的ISO代码' })
  @Expose()
  readonly currency: string

  @IsString({ message: '产品id' })
  @IsOptional()
  @Expose()
  readonly product: string

  @IsObject({ message: '产品名称' })
  @IsOptional()
  @Expose()
  readonly product_data: ProductDataDto

  @IsInt({ message: '价格以美分为单位的正整数' })
  @IsOptional()
  @Expose()
  readonly unit_amount: number

  @IsBoolean({ message: '价格是否生效' })
  @IsOptional()
  @Expose()
  readonly active: boolean
}
