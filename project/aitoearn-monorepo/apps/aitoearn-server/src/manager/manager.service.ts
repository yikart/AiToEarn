import { Injectable } from '@nestjs/common'
import { AitoearnAuthService } from '@yikart/aitoearn-auth'
import { RedisService } from '@yikart/redis'
import { UserService } from '../user/user.service'

@Injectable()
export class ManagerService {
  constructor(
    private readonly authService: AitoearnAuthService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取用户Token
   * @param userId
   * @returns
   */
  async getUserToken(userId: string) {
    const userInfo = await this.userService.getUserInfoById(userId)
    if (!userInfo)
      return ''

    const token = this.authService.generateToken(userInfo)
    return token
  }
}
