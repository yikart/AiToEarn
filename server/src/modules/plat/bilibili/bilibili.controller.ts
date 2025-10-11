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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessBackDto,
  ArchiveAddByUtokenBodyDto,
  ArchiveAddByUtokenQueryDto,
} from './dto/bilibili.dto';
import { BilibiliService } from './bilibili.service';
import { GetToken, Public } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';

@ApiTags('plat/bilibili - B站平台')
@Controller('plat/bilibili')
export class BilibiliController {
  constructor(private readonly bilibiliService: BilibiliService) {}

  @ApiOperation({ summary: '获取页面的认证URL' })
  @Get('auth/url/:type')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Param('type') type: 'h5' | 'pc',
  ) {
    const res = await this.bilibiliService.getAuthUrl(token.id, type);
    return res;
  }

  @ApiOperation({ summary: '获取AccessToken,并记录到用户，给平台回调用' })
  @Public()
  @Get('auth/back/:userId')
  async getAccessToken(
    @Param('userId') userId: string,
    @Query() query: AccessBackDto,
  ) {
    const res = await this.bilibiliService.setUserAccessToken({
      userId,
      ...query,
    });
    return res;
  }

  @ApiOperation({ summary: '查询用户已授权权限列表' })
  @Get('account/scopes')
  async getAccountScopes(@GetToken() token: TokenInfo) {
    const accessToken = await this.bilibiliService.getUserAccessToken(token.id);
    return this.bilibiliService.getAccountScopes(accessToken);
  }

  @ApiOperation({ summary: '视频初始化' })
  @Post('video/init')
  async videoInit(@GetToken() token: TokenInfo) {
    const accessToken = await this.bilibiliService.getUserAccessToken(token.id);
    return this.bilibiliService.videoInit(accessToken);
  }

  @ApiOperation({ summary: '封面上传' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('cover/upload')
  async coverUpload(
    @GetToken() token: TokenInfo,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const accessToken = await this.bilibiliService.getUserAccessToken(token.id);
    return this.bilibiliService.coverUpload(accessToken, file);
  }

  @ApiOperation({ summary: '视频稿件提交' })
  @Post('archive/add-by-utoken')
  async archiveAddByUtoken(
    @Query() query: ArchiveAddByUtokenQueryDto,
    @Body() body: ArchiveAddByUtokenBodyDto,
  ) {
    const data = {
      ...body,
      no_reprint: body.noReprint,
      tag: body.tag.join(','),
    };
    const { accessToken, uploadToken } = query;
    return this.bilibiliService.archiveAddByUtoken(
      accessToken,
      uploadToken,
      data,
    );
  }

  @ApiOperation({ summary: '分区查询' })
  @Get('archive/type/list/:accessToken')
  async archiveTypeList(@GetToken() token: TokenInfo) {
    const accessToken = await this.bilibiliService.getUserAccessToken(token.id);
    return this.bilibiliService.archiveTypeList(accessToken);
  }
}
