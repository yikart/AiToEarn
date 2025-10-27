/*
 * @Author: nevin
 * @Date: 2022-03-03 16:50:53
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-24 17:48:23
 * @Description: 阿里云OSS文件存储
 */
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import ossConfig from '../../../config/oss.config';
import { OssCoreModule } from './oss-core.module';
import { OssService } from './oss.service';
import { OssController } from './oss.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ossConfig], // 加载自定义配置项
    }),
    OssCoreModule.forRoot(ossConfig().OSS_CONFIG.INIT_OPTION),
  ],
  controllers: [OssController],
  providers: [OssService],
  exports: [OssService],
})
export class OssModule {}
