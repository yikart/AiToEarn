import { NatsMessagePattern } from '@common/decorators'
import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import {
  GoogleLoginDto,
  NewMailDto,
  UpdateUserInfoDto,
  UpdateUserPasswordDto,
  UpdateUserStatusDto,
  UserInfoDto,
  UserMailDto,
} from './dto/user.dto'
import { UserService } from './user.service'

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name)

  constructor(private readonly userService: UserService) { }

  @NatsMessagePattern('user.user.createUserByMail')
  createUserByMail(@Payload() data: NewMailDto) {
    return this.userService.createUserByMail(
      data.mail,
      data.password,
      data.salt,
      data.inviteCode,
    )
  }

  @NatsMessagePattern('user.user.getUserInfoByMail')
  getUserInfoByMail(@Payload() data: UserMailDto) {
    return this.userService.getUserInfoByMail(data.mail, data.all)
  }

  // 获取用户信息
  @NatsMessagePattern('user.user.getUserInfoById')
  getUserInfoById(@Payload() data: UserInfoDto) {
    return this.userService.getUserInfoById(data.id, data.all)
  }

  // 更新用户信息
  @NatsMessagePattern('user.user.updateUserInfo')
  updateUserInfo(@Payload() data: UpdateUserInfoDto) {
    return this.userService.updateUserInfo(data.id, data)
  }

  // 更新用户状态
  @NatsMessagePattern('user.user.updateUserStatus')
  updateUserStatus(@Payload() data: UpdateUserStatusDto) {
    return this.userService.updateUserStatus(data.id, data.status)
  }

  // 更新用户密码
  @NatsMessagePattern('user.user.updateUserPassword')
  updateUserPassword(@Payload() data: UpdateUserPasswordDto) {
    return this.userService.updateUserPassword(data.id, { password: data.password, salt: data.salt })
  }

  // 谷歌登录创建账号
  @NatsMessagePattern('user.user.getUserInfoByGoogle')
  getUserInfoByGoogle(@Payload() data: GoogleLoginDto) {
    this.logger.debug('Google login request received')
    return this.userService.getUserInfoByGoogle(data.clientId, data.credential)
  }
}
