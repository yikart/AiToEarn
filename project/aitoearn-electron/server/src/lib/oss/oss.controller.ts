/*
 * @Author: nevin
 * @Date: 2022-03-07 13:37:06
 * @LastEditors: nevin
 * @LastEditTime: 2024-12-22 21:58:14
 * @Description: 文件上传
 */
import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Headers,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { OssService } from './oss.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/auth.guard';

@ApiTags('OSS - 文件(阿里云)')
@Controller('oss')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @ApiOperation({ description: '存入临时目录', summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Headers() headers: any,
  ) {
    const secondPath: string = headers['second-path'];
    return await this.ossService.upFileStream(file, secondPath);
  }

  @ApiOperation({ description: '不存入临时目录', summary: '上传文件' })
  @Public()
  @Post('upload/permanent')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPermanentFile(
    @UploadedFile() file: Express.Multer.File,
    @Headers() headers: any,
  ) {
    const secondPath: string = headers['second-path'];

    // 不开启临时目录
    return await this.ossService.upFileStream(file, secondPath, null, true);
  }

  @ApiOperation({ description: '存入临时目录', summary: '上传文件数组' })
  @Public()
  @Post('upload/list')
  @UseInterceptors(FilesInterceptor('files'))
  uploadFileList(
    @UploadedFiles() files: Express.Multer.File[],
    @Headers() headers: any,
  ) {
    const secondPath: string = headers['second-path'];
    files.forEach((file) => {
      this.ossService.upFileStream(file, secondPath);
    });
    return { status: 'ok' };
  }

  @ApiOperation({ description: '上传URL图片', summary: '上传URL图片' })
  @Public()
  @Post('upload/url')
  async uploadFileOfUrl(@Body() body: { path: string; url: string }) {
    const res = await this.ossService.upFileByUrl(body.url, {
      path: body.path,
    });
    return res;
  }
}
