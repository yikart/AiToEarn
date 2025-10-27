/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-04-14 17:10:59
 * @LastEditors: nevin
 * @Description: 艺咖三方平台认证服务 PlatAuth platAuth
 */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { BaseUrl } from './comment';
import * as crypto from 'crypto';

@Injectable()
export class PlatAuthWxGzhService {
  appId = '';
  secret = '';
  vi = 'yika2025'; // 盐
  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get('WX_GZH.WX_GZH_ID');
    this.secret = this.configService.get('WX_GZH.WX_GZH_SECRET');
  }

  // 生成加密
  private async generateEncryptionKey(): Promise<string> {
    // 1.appId+secret进行sha1加密
    const encryptionKey = crypto
      .createHash('sha256')
      .update(this.appId + this.secret)
      .digest();

    const vi = Buffer.from(this.vi, 'utf8')
      .toString()
      .padEnd(16, '0')
      .slice(0, 16); // 强制16字节

    // 加入当前时间戳,进行AES加密
    // 3. 时间戳 AES 加密
    const timestamp = Date.now().toString(); // 显式转为字符串
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, vi);
    let encrypted = cipher.update(timestamp, 'utf8', 'hex');
    encrypted += cipher.final('hex'); // 合并 update 和 final 的结果
    return encrypted;
  }

  /**
   * 获取微信登录二维码的票据
   * @returns
   */
  async getWxLoginQrcode(): Promise<{
    key: string;
    ticket: string;
  }> {
    const url = `${BaseUrl}/wxGzh/qrcode/get/${this.appId}`;
    const result = await axios.get<{
      code: number;
      message: string;
      data: {
        key: string;
        ticket: string;
      };
    }>(url);

    return result.data.data;
  }

  /**
   * 创建公众号菜单
   */
  async createWxGzhMenu(body: any): Promise<{
    errcode: number;
    errmsg: string;
  }> {
    if (typeof body !== 'object' || body === null || Array.isArray(body))
      return { errcode: 400, errmsg: '菜单必须为非空对象' };

    const sign = await this.generateEncryptionKey();
    console.log('----- sign: ', sign);

    const url = `${BaseUrl}/wxGzh/menu/create/${this.appId}`;
    const result = await axios.post<{
      code: number;
      message: string;
      data: {
        errcode: number;
        errmsg: string;
      };
    }>(url, { data: body, authKey: sign });

    return result.data.data;
  }

  /**
   * 获取菜单
   */
  async getMenu(): Promise<{
    errcode: number;
    errmsg: string;
    data: any;
  }> {
    const url = `${BaseUrl}/wxGzh/menu/get/${this.appId}`;
    const result = await axios.get<{
      code: number;
      message: string;
      data: any;
    }>(url);

    return result.data.data;
  }
}
