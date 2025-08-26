/*
 * @Author: nevin
 * @Date: 2024-06-17 20:12:31
 * @LastEditTime: 2025-05-06 15:49:03
 * @LastEditors: nevin
 * @Description: 用户
 */
import { ApiProperty } from '@nestjs/swagger'
import { GenderEnum } from 'src/common/enums/all.enum'
import { User } from 'src/transports/user/comment'

export class UserResDto implements Partial<User> {
  @ApiProperty({ title: '用户ID', required: true })
  id: string

  @ApiProperty({ title: '用户名', required: true })
  name: string

  @ApiProperty({ title: '手机号', required: true })
  phone: string

  @ApiProperty({ title: '性别', enum: GenderEnum, required: false })
  gender?: GenderEnum

  @ApiProperty({ title: '头像图片链接', required: false })
  avatar?: string

  @ApiProperty({ title: '简介', required: false })
  desc?: string
}
