import { UserVipCycleType } from '@yikart/mongodb'
/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: VIP
 */
import { Expose } from 'class-transformer'
import { IsEnum, IsString } from 'class-validator'

export class UpdateVipInfoDto {
  @IsString({ message: 'ID' })
  @Expose()
  readonly id: string

  @IsEnum(UserVipCycleType, { message: '充值时间周期类型' })
  @Expose()
  readonly cycleType: UserVipCycleType
}
