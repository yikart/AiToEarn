/*
 * @Author: nevin
 * @Date: 2022-03-03 16:50:53
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-24 17:48:23
 * @Description: 阿里云OSS文件存储
 */
import { Module } from '@nestjs/common'
import { AliOSSModule } from 'src/libs/ali-oss/ali-oss.module'
import { config } from '@/config'
import { FileController } from './file.controller'
import { FileService } from './file.service'

@Module({
  imports: [
    AliOSSModule.forRoot(config.aliOss),
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
