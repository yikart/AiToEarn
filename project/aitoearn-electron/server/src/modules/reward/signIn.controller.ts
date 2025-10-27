/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: signIn SignIn 签到
 */
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import { SignInService } from './signIn.service';
import { GetToken } from '../../auth/auth.guard';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { CreateSignInDto, QuerySignInListDto } from './dto/signIn.dto';
import { SignIn } from 'src/db/schema/signIn.schema';

@ApiTags('reward/signIn - 奖励/签到')
@Controller('reward/signIn')
export class SignInController {
  constructor(private readonly signInService: SignInService) {}

  @ApiOperation({ summary: '创建签到记录' })
  @Post()
  @ApiResult({ type: SignIn })
  async createSignInRecord(
    @GetToken() token: TokenInfo,
    @Body() body: CreateSignInDto,
  ) {
    const res = await this.signInService.createSignInRecord(
      token.id,
      body.type,
    );
    return res;
  }

  @ApiOperation({ summary: '获取时间段内的签到列表' })
  @Get('list')
  async getSignInList(
    @GetToken() token: TokenInfo,
    @Query() query: QuerySignInListDto,
  ) {
    return this.signInService.getSignInList(token.id, query);
  }
}
