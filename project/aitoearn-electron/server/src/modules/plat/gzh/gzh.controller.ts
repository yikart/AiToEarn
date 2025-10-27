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
import { GzhService } from './gzh.service';
import { Public } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('plat/gzh - B站平台')
@Controller('plat/gzh')
export class GzhController {
  constructor(private readonly bilibiliService: GzhService) {}

  @ApiOperation({ summary: '获取AccessToken' })
  @Public()
  @Get('accessToken')
  async getAccessToken(@Query() query: AccessBackDto) {
    // const res = await this.bilibiliService.getAccessToken(query.code);
    // return res;
  }

  @ApiOperation({ summary: '刷新授权Token' })
  @Get('refreshAccessToken/:refreshToken')
  async refreshAccessToken(@Param('refreshToken') refreshToken: string) {
    return this.bilibiliService.refreshAccessToken(refreshToken);
  }

  @ApiOperation({ summary: '查询用户已授权权限列表' })
  @Get('account/scopes/:accessToken')
  async getAccountScopes(@Param('accessToken') accessToken: string) {
    return this.bilibiliService.getAccountScopes(accessToken);
  }

  @ApiOperation({ summary: '视频初始化' })
  @Post('video/init/:accessToken')
  async videoInit(@Param('accessToken') accessToken: string) {
    return this.bilibiliService.videoInit(accessToken);
  }

  @ApiOperation({ summary: '封面上传' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('cover/upload')
  async coverUpload(
    @Param('accessToken') accessToken: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
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
    // return this.bilibiliService.archiveAddByUtoken(
    //   accessToken,
    //   uploadToken,
    //   data,
    // );
  }

  @ApiOperation({ summary: '分区查询' })
  @Get('archive/type/list/:accessToken')
  async archiveTypeList(@Param('accessToken') accessToken: string) {
    return this.bilibiliService.archiveTypeList(accessToken);
  }
}
