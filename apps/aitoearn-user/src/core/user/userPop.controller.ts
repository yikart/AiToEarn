/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 15:50:54
 * @LastEditors: nevin
 * @Description: 用户推广路由
 */

import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { AppException, NatsMessagePattern, ResponseCode } from '@yikart/common'
import { UserStatus } from '@yikart/mongodb'
import { GetUserByPopularizeCodeDto, UserIdDto } from './dto/user.dto'
import { UserService } from './user.service'

@Controller('user/pop')
export class UserPopController {
  constructor(private readonly userService: UserService) { }

  @NatsMessagePattern('user.user.generatePopCode')
  async generateUsePopularizeCode(@Payload() data: UserIdDto) {
    const userInfo = await this.userService.getUserInfoById(data.id)
    if (!userInfo || userInfo.status !== UserStatus.OPEN)
      throw new AppException(ResponseCode.UserNotFound)

    if (userInfo.popularizeCode)
      return userInfo.popularizeCode

    const res = await this.userService.generateUsePopularizeCode(userInfo.id)
    return res
  }

  @NatsMessagePattern('user.user.getUserByPopularizeCode')
  async getUserByPopularizeCode(@Payload() data: GetUserByPopularizeCodeDto) {
    const userInfo = await this.userService.getUserByPopularizeCode(data.code)
    if (!userInfo)
      throw new AppException(ResponseCode.UserNotFound)

    return userInfo
  }
}
