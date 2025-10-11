/*
 * @Author: nevin
 * @Date: 2022-03-04 10:40:22
 * @LastEditors: nevin
 * @LastEditTime: 2024-12-20 22:45:03
 * @Description: 阿里云OSS
 */
import OSS from 'ali-oss';

export type OssOptions = OSS.Options;

export interface OssModuleAsyncOption {
  imports?: any;
  useValue?: OssOptions;
  useFactory?: (...args: any[]) => OssOptions; // 生成options的构造函数
  inject?: any[]; // 注入
}

export interface OssNewFilePath {
  path?: string;
  permanent?: boolean;
  newName?: string;
}
