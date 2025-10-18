/*
 * @Author: nevin
 * @Date: 2022-03-07 13:37:06
 * @LastEditors: nevin
 * @LastEditTime: 2024-12-22 21:58:14
 * @Description: 文件
 */
import {
  Body,
  Controller,
  Headers,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../auth/auth.guard'
import {
  CompletePartDto,
  InitMultipartUploadDto,
  UploadPartDto,
} from './dto/file.dto'
import { FileService } from './file.service'

@ApiTags('文件')
@Public()
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // @ApiOperation({ description: '获取上传的签名URL', summary: '获取上传的签名URL' })
  // @Get('uploadUrl')
  // async getUploadUrl(
  //   @Query() query: GetUploadUrlDto,
  // ) {
  //   const url = await this.fileService.getUploadUrl(
  //     query.key,
  //     query.contentType,
  //     query.expiresIn,
  //   )
  //   return { url, key: query.key }
  // }

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
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Headers() headers: any,
  ) {
    const secondPath: string = headers['second-path']
    return await this.fileService.upFileStream(file, secondPath)
  }

  @ApiOperation({
    description: '初始化文件分片上传',
    summary: '初始化文件分片上传',
  })
  @Post('uploadPart/init')
  async initiateMultipartUpload(@Body() body: InitMultipartUploadDto) {
    return await this.fileService.initiateMultipartUpload(
      body.secondPath,
      body.contentType,
    )
  }

  // @ApiOperation({ description: '获取分片上传的签名URL', summary: '获取分片上传的签名URL' })
  // @Get('uploadUrl')
  // async getUploadPartUrl(
  //   @Query() query: GetUploadPartUrlUrlDto,
  // ) {
  //   const url = await this.fileService.getUploadPartUrl(
  //     query.key,
  //     query.uploadId,
  //     query.partNumber,
  //     query.expiresIn,
  //   )
  //   return { url, key: query.key }
  // }

  @ApiOperation({ description: '上传文件分片', summary: '上传文件分片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileId: {
          type: 'string',
        },
        uploadId: {
          type: 'string',
        },
        partNumber: {
          type: 'number',
        },
      },
    },
  })
  @Post('uploadPart/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPart(
    @UploadedFile() file: any,
    @Query() query: UploadPartDto,
  ) {
    return await this.fileService.uploadPart(
      query.fileId,
      query.uploadId,
      query.partNumber,
      file.buffer,
    )
  }

  @ApiOperation({ description: '合并文件分片', summary: '合并文件分片' })
  @Post('uploadPart/complete')
  async completeMultipartUpload(@Body() body: CompletePartDto) {
    return await this.fileService.completeMultipartUpload(
      body.fileId,
      body.uploadId,
      body.parts,
    )
  }
}
