/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 15:50:54
 * @LastEditors: nevin
 * @Description: 用户设置信息路由 config Config
 */
import { Body, Controller, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../auth/interfaces/auth.interfaces';
import { ErrHttpBack } from '../filters/http-exception.back-code';
import { AppHttpException } from '../filters/http-exception.filter';
import { GetToken } from '../auth/auth.guard';
import { UserStatus } from 'src/db/schema/user.schema';
import { UserConfigService } from './userConfig.service';
import { UserService } from './user.service';
import { SetUserEarnDto } from './dto/userConfig.dto';

@ApiTags('用户自定义配置')
@Controller('user/config')
export class UserConfigController {
  constructor(
    private readonly userService: UserService,
    private readonly userConfigService: UserConfigService,
  ) {}

  @ApiOperation({
    summary: '设置自动赚钱配置',
  })
  @Put('earn')
  async setUserEarnInfo(
    @GetToken() token: TokenInfo,
    @Body() body: SetUserEarnDto,
  ) {
    const res = await this.userConfigService.setUserEarnInfo(token.id, body);
    return res;
  }
}
