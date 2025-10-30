/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 15:50:54
 * @LastEditors: nevin
 * @Description: 用户推广路由
 */
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { UserService } from './user.service'

@ApiTags('用户推广')
@Controller('user/pop')
export class UserPopController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '生成并获取自己的推广码',
  })
  @Get('code')
  async generateUsePopularizeCode(@GetToken() token: TokenInfo) {
    return this.userService.generateUsePopularizeCode(token.id)
  }
}
