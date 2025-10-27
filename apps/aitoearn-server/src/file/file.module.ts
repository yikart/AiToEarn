/*
 * @Author: nevin
 * @Date: 2022-03-03 16:50:53
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-24 17:48:23
 * @Description: 文件存储
 */
import { Global, Module } from '@nestjs/common'
import { S3Module } from '@yikart/aws-s3'
import { config } from '../config'
import { FileController } from './file.controller'
import { FileService } from './file.service'

@Global()
@Module({
  imports: [
    S3Module.forRoot(config.awsS3),
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
