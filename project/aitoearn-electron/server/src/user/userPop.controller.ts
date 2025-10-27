/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 15:50:54
 * @LastEditors: nevin
 * @Description: 用户推广路由
 */
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../auth/interfaces/auth.interfaces';
import { UserService } from './user.service';
import { ErrHttpBack } from '../filters/http-exception.back-code';
import { AppHttpException } from '../filters/http-exception.filter';
import { GetToken } from '../auth/auth.guard';
import { UserStatus } from 'src/db/schema/user.schema';

@ApiTags('用户推广')
@Controller('user/pop')
export class UserPopController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '生成并获取自己的推广码',
  })
  @Get('code')
  async generateUsePopularizeCode(@GetToken() token: TokenInfo) {
    const userInfo = await this.userService.getUserInfoById(token.id);
    if (!userInfo) throw new AppHttpException(ErrHttpBack.err_user_no_had);
    if (userInfo.status === UserStatus.STOP)
      throw new AppHttpException(ErrHttpBack.err_no_power_login);

    if (!!userInfo.popularizeCode) return userInfo.popularizeCode;

    if (!token.phone)
      throw new AppHttpException(ErrHttpBack.err_user_phone_null);
    const res = await this.userService.generateUsePopularizeCode(
      token.id,
      token.phone,
    );
    return res;
  }
}
