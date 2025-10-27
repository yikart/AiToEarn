/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 15:50:54
 * @LastEditors: nevin
 * @Description: 用户路由
 */
import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../auth/interfaces/auth.interfaces';
import { UpdateUserInfoDto, UserResDto, LoginByPhoneDto } from './dto/user.dto';
import { UserService } from './user.service';
import { ErrHttpBack } from '../filters/http-exception.back-code';
import { AppHttpException } from '../filters/http-exception.filter';
import { LoginService, LoginTypeCacheKey } from './login.service';
import { GetToken } from '../auth/auth.guard';
import { ParamsValidationPipe } from '../validation.pipe';
import { RedisService } from 'src/lib/redis/redis.service';

@ApiTags('user - 用户')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly loginService: LoginService,
    private readonly redisService: RedisService,
  ) {}

  @ApiOperation({
    description: '获取自己的用户信息',
    summary: '获取自己的用户信息',
  })
  @ApiResponse({ status: 200, type: UserResDto })
  @Get('mine')
  getUserInfoById(@GetToken() token: TokenInfo) {
    return this.userService.getUserInfoById(token.id);
  }

  @ApiOperation({ description: '更新用户信息', summary: '更新用户信息' })
  @ApiResponse({ status: 200, type: UserResDto })
  @Put('info/update')
  async updateInfo(
    @GetToken() token: TokenInfo,
    @Body(new ParamsValidationPipe()) body: UpdateUserInfoDto,
  ) {
    const userInfo = await this.userService.getUserInfoById(token.id);

    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        userInfo[key] = body[key];
      }
    }

    this.userService.updateUser(token.id, userInfo);
    return userInfo;
  }

  @ApiOperation({ description: '用户注销', summary: '用户注销' })
  @ApiResponse({ status: 200, type: UserResDto })
  @Delete('del')
  async del(@GetToken() token: TokenInfo) {
    const userInfo = await this.userService.getUserInfoById(token.id);
    if (!userInfo) throw new AppHttpException(ErrHttpBack.err_user_no_had);

    const res = await this.userService.deleteUser(userInfo);
    return res;
  }

  @ApiOperation({
    summary: '用户更新自己的电话号码',
    description: '和手机验证码登录使用同一个验证码',
  })
  @Put('updatePhone')
  async updatePhone(
    @GetToken() token: TokenInfo,
    @Body() body: LoginByPhoneDto,
  ) {
    const { phone, code } = body;

    const res = await this.loginService.verifyPhoneCode(
      phone,
      code,
      LoginTypeCacheKey.Code,
    );
    if (!res) throw new AppHttpException(ErrHttpBack.err_user_code_nohad);
    return await this.userService.updateUserPhone(token.id, phone);
  }
}
