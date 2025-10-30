/*
 * @Author: nevin
 * @Date: 2022-03-03 16:50:53
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-24 17:48:23
 * @Description: 文件存储
 */
import { Global, Module } from '@nestjs/common'
import { config } from '../../config'
import { S3Module } from '../../libs/aws-s3/s3.module'
import { FileService } from './file.service'

@Global()
@Module({
  imports: [
    S3Module.forRoot(config.awsS3),
  ],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
