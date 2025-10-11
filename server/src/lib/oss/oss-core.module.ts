/*
 * @Author: nevin
 * @Date: 2022-03-03 16:50:53
 * @LastEditors: nevin
 * @LastEditTime: 2024-06-24 17:49:30
 * @Description: 阿里云OSS文件存储
 */
import { DynamicModule, Global, Module } from '@nestjs/common';
import OSS from 'ali-oss';
import { OssProvider } from './oss.provider';
import { OssController } from './oss.controller';

@Global()
@Module({
  providers: [OssProvider],
  controllers: [OssController],
})
export class OssCoreModule {
  /**
   * 注册OSS服务
   * @param options
   * @param resetName 重命名
   */
  static forRoot(options: OSS.Options, resetName?: string): DynamicModule {
    const ossClientProvider = OssProvider.createClientProvider(
      options,
      resetName,
    );
    return {
      module: OssCoreModule,
      providers: [ossClientProvider],
      exports: [ossClientProvider],
    };
  }
}
