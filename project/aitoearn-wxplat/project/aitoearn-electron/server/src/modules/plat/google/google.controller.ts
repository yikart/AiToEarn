/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: signIn SignIn 签到
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Render,
  Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessBackDto,
  ArchiveAddByUtokenBodyDto,
  ArchiveAddByUtokenQueryDto,
  GoogleLoginDto
} from './dto/google.dto';
import { GoogleService } from './google.service';
import { GetToken, Public } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { Account } from 'src/db/schema/account.schema';
import { ApiResult } from 'src/common/decorators/api-result.decorator';
import { ParamsValidationPipe } from 'src/validation.pipe';

@ApiTags('plat/google - Google账号登录')
@Controller('plat/google')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @ApiOperation({ summary: '测试' })
  @Public()
  @Get('test')
  // @Render('google/index')
  async getTest(@Res() res: Response) {
    // const res = "success";
    const result = { message: "hello" };
    console.log(result);  // 在控制台输出，确保数据正确
    // return result;
    return res.render('google/index', result);
  }


  @ApiOperation({ summary: '获取用户登录授权URL' })
  @Public()
  @Get('auth/code')
  async getGooleAuthCode(
    // @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
    @Query('platform') platform: string,
    @Query('userEmail') userEmail?: string,
    ) {
    // const result = await this.googleService.getAuthCode(userEmail, platform, type);
    const result = await this.googleService.getAuthCode_v2(platform, type);
    console.log(result.data);
    return result;
  }

  @ApiOperation({ summary: 'Google登录' })
  @Public()
  // @Get('auth/login')
  @Post('auth/login')
  @Public()
  @ApiResult({ type: Account })
  async googleLogin(
    @Body(new ParamsValidationPipe()) body: GoogleLoginDto,
  ) {
    // console.log(body.clientId, body.credential)
    return this.googleService.googleLogin(body.clientId, body.credential);
  }

  @ApiOperation({ summary: '获取AccessToken' })
  @Public()
  @Get('auth/accessToken')
  async getAccessToken(
    @Query('code') code: string,
    @Query('state') state: string,
    // @Query() query: AccessBackDto,
    // @Res() res: Response
  ) {

    try {
      // 使用授权码 (code) 交换访问令牌
      const systemToken  = await this.googleService.setUserAccessToken_V2({
        code,
        state
      });
      console.log("+++++++++++++++++++++++");
      console.log(systemToken );
      console.log("+++++++++++++++++++++++");

      // 成功获取令牌后，返回成功消息或视图
      // return res.redirect(301, 'https://www.example.com?name=JohnDoe&age=30');
      // return res.render('google/index', { message: '授权成功', userInfo: userInfo})
      return systemToken;
    } catch (err) {
      console.log('Error during access token exchange', err);
      // return res.render('google/index', { message: '授权失败', error: err });
      return false
    }

    // const result = await this.googleService.getAccessToken(code)
    // return result;

    // const result = { message: "hello" };
    // return result;
    // return res.render('google/index', { message: result});
    // const data = {
    //   ...body,
    //   code: body.code,
    //   state: body.state,
    // };
    // const { accessToken, uploadToken } = query;
    // return this.bilibiliService.archiveAddByUtoken(
    //   accessToken,
    //   uploadToken,
    //   data,
    // );
  }


  @ApiOperation({ summary: '刷新授权Token' })
  // @Public()
  @Get('auth/refreshAccessToken')
  async refreshAccessToken(
    @GetToken() token: TokenInfo,
    ) {
    return this.googleService.refreshAccessToken(token.id);
  }

  @ApiOperation({ summary: '获取已授权用户信息' })
  // @Public()
  // @Get('auth/userinfo/:accessToken')
  @Get('auth/userinfo')
  async getUserInfo(
    // @Param('accessToken') accessToken: string,
    // @Query('userId') userId: string,
    @GetToken() token: TokenInfo,
    ) {
    // return this.googleService.getUserInfo(accessToken, token);
    console.log("前端传来的token：  ", token);
    const accessToken = await this.googleService.getUserAccessToken(token.id);
    return this.googleService.getUserInfo(accessToken, token);
  }

  @ApiOperation({ summary: '查询用户已授权权限列表' })
  // @Public()
  @Get('auth/scopes')
  async getAccountScopes(
    // @Param('accessToken') accessToken: string
    @GetToken() token: TokenInfo,
    ) {
      const accessToken = await this.googleService.getUserAccessToken(token.id);
      return this.googleService.getAccountScopes(accessToken);
    }

}
