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
  Get,
  Headers,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import {
  CompletePartDto,
  GetUploadUrlDto,
  InitMultipartUploadDto,
  UploadPartDto,
} from './dto/file.dto'
import { FileService } from './file.service'

@ApiTags('OpenSource/Home/File')
@Public()
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiDoc({
    summary: 'Get Upload Signed URL',
    description: 'Retrieve a signed URL for uploading a file.',
    query: GetUploadUrlDto.schema,
  })
  @Get('uploadUrl')
  async getUploadUrl(
    @Query() query: GetUploadUrlDto,
  ) {
    const url = await this.fileService.getUploadUrl(
      query.key,
    )
    return url
  }

  @ApiDoc({
    summary: 'Upload File to Temporary Storage',
    description: 'Upload a file to the temporary storage directory.',
  })
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

  @ApiDoc({
    summary: 'Initiate Multipart Upload',
    description: 'Initialize a multipart upload session for large files.',
    body: InitMultipartUploadDto.schema,
  })
  @Post('uploadPart/init')
  async initiateMultipartUpload(@Body() body: InitMultipartUploadDto) {
    return await this.fileService.initiateMultipartUpload(
      body.secondPath,
      body.contentType,
    )
  }

  // Legacy implementation for fetching multipart upload signed URL
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

  @ApiDoc({
    summary: 'Upload File Part',
    description: 'Upload a single part of a multipart file.',
    query: UploadPartDto.schema,
  })
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

  @ApiDoc({
    summary: 'Complete Multipart Upload',
    description: 'Complete the multipart upload process by merging uploaded parts.',
    body: CompletePartDto.schema,
  })
  @Post('uploadPart/complete')
  async completeMultipartUpload(@Body() body: CompletePartDto) {
    return await this.fileService.completeMultipartUpload(
      body.fileId,
      body.uploadId,
      body.parts,
    )
  }
}
