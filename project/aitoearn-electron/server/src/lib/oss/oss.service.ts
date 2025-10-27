/*
 * @Author: nevin
 * @Date: 2022-03-03 16:59:23
 * @LastEditors: nevin
 * @LastEditTime: 2025-02-25 23:11:01
 * @Description: oss函数
 */
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import * as moment from 'moment';
import { Duplex } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { OssNewFilePath } from './oss.interface';
import axios from 'axios';
@Injectable()
export class OssService {
  private HOST_URL: string;
  private NODE_ENV: string;
  constructor(
    @Inject('OSS_CLIENT_PROVIDER') private client: OSS,
    private configService: ConfigService,
  ) {
    this.HOST_URL = this.configService.get('OSS_CONFIG.HOST_URL');
    this.NODE_ENV = this.configService.get('SERVER_CONFIG.NODE_ENV');
  }

  private getNewFilePath(opt: OssNewFilePath) {
    let { path, newName } = opt;

    path = `${this.NODE_ENV}/${opt.permanent ? '' : 'temp/'}${path || `nopath/${moment().format('YYYYMM')}`}`;
    path = path.replace('//', '/');
    newName = newName || uuidv4();

    return {
      path,
      newName,
    };
  }

  /**
   * 获取完整url中的文件名即去除host域名
   * @param url
   * @returns
   */
  getFileNameFromUrl(url: string) {
    const tempStr = url.split(`${this.HOST_URL}/`);
    return tempStr.length <= 0 ? '' : tempStr[tempStr.length - 1];
  }

  /**
   * 文件上传
   * @param {Express.Multer.File} file 文件buffer流对象
   * @param {string | undefined} path 路径，不传就会使用‘nopath’前缀
   * @param {string | undefined} newName 新的文件名
   * @param {string | undefined} permanent 是否为永久目录，默认临时
   * @returns
   */
  async upFileStream(
    file: Express.Multer.File,
    path?: string,
    newName?: string,
    permanent?: boolean,
  ) {
    const { buffer, mimetype } = file;
    const ret = this.getNewFilePath({ path, newName, permanent });
    path = ret.path;
    newName = ret.newName;

    const tempStr = mimetype.split('/');
    const fileTypeStr = tempStr[tempStr.length - 1];

    const stream = new Duplex();
    stream.push(buffer);
    stream.push(null);

    try {
      const upRes = await this.client.putStream(
        `${path}/${newName}.${fileTypeStr}`,
        stream,
      );

      const {
        name,
        res: { status },
      } = upRes;

      if (status !== HttpStatus.OK) throw new Error('文件上传失败');

      return {
        name,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 去除文件前置
   * @param filePath
   */
  private noHostFilePath(filePath: string) {
    const hostUrl = this.configService.get('OSS_CONFIG.HOST_URL');

    const _hostUrl = hostUrl.replace('https', 'http');
    if (filePath.indexOf(_hostUrl) === 0) {
      filePath = filePath.replace(`${_hostUrl}/`, '');
      return this.noHostFilePath(filePath);
    }

    return filePath;
  }

  /**
   * 将临时目录文件转到新的目录文件
   * @param filePath 原文件地址
   * @param newFilePath 不填就是去除temp标识
   * @returns
   */
  async changeFilePath(
    filePath: string,
    newFilePath?: string,
  ): Promise<string> {
    // 干掉前置
    filePath = this.noHostFilePath(filePath);

    // 复制文件
    newFilePath = newFilePath || filePath.replace('temp/', '');

    if (filePath === newFilePath) return filePath;

    try {
      const {
        res: { status },
      } = await this.client.copy(newFilePath, filePath);
      if (status !== HttpStatus.OK) throw new Error('文件上传失败');
      return newFilePath;
    } catch (error) {
      console.log('========== error', error);
      throw error;
    }
  }

  /**
   * 上传二进制流文件
   * @param buffer 二进制流 base64格式
   * @param path 路径
   * @param permanent 是否为永久目录，默认临时
   */
  async uploadByStream(
    buffer: Buffer, // base64格式(不带前缀)
    option: {
      path?: string;
      permanent?: boolean;
      fileType: string;
    },
  ): Promise<string> {
    const { path, permanent, fileType } = option;
    const objectName = `${this.NODE_ENV}/${permanent ? '' : 'temp/'}${path || 'nopath'}${`/${moment().format('YYYYMM')}/${uuidv4()}.${fileType}`}`;

    // 上传到阿里云
    try {
      const res = await this.client.put(objectName, buffer);
      return res.name;
    } catch (error) {
      console.log('----- uploadByBase64 error -----', error);
      return '';
    }
  }

  /**
   * 根据网络地址上传到阿里云
   * @param url
   * @param option
   * @returns
   */
  async upFileByUrl(
    url: string,
    option: {
      path?: string;
      permanent?: boolean;
    },
  ) {
    const { path, permanent } = option;
    let fileType = '';
    if (url.includes('.')) {
      fileType = url.split('.').pop();
    }
    const objectName = `${this.NODE_ENV}/${permanent ? '' : 'temp/'}${path || 'nopath'}${`/${moment().format('YYYYMM')}/${uuidv4()}.${fileType}`}`;

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      const res = await this.client.put(objectName, buffer);
      return res.name;
    } catch (error) {
      console.log('----- upFileByUrl error -----', error);
      return '';
    }
  }

  /**
   * TODO: 未完成 未使用 上传base64图片
   */
  async uploadByBuffer(
    base64Img: string,
    path?: string,
    permanent?: boolean,
  ): Promise<string> {
    const imageBuffer = Buffer.from(base64Img, 'base64');
    const objectName = `${this.NODE_ENV}/${permanent ? '' : 'temp/'}${`nopath/${moment().format('YYYYMM')}/${uuidv4()}.png`}`;
    try {
      const {
        url,
        res: { status },
      } = await this.client.put(objectName, imageBuffer);

      if (status === 200) {
        return url;
      } else {
        return '';
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return '';
    }
  }
}
