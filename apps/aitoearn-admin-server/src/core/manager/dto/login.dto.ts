/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { Expose } from 'class-transformer'
import { IsString } from 'class-validator'

export class AccountLoginDto {
  @IsString({ message: '账户' })
  @Expose()
  readonly account: string

  @IsString({ message: '密码' })
  @Expose()
  readonly password: string
}
