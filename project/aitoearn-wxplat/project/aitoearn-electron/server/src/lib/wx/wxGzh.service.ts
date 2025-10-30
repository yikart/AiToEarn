/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2025-02-26 10:12:02
 * @LastEditors: nevin
 * @Description: 微信公众号服务
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

@Injectable()
export class WxGzhService {
  appId = '';
  secret = '';
  token = '';
  aesKey = '';
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.appId = this.configService.get('WX_GZH.WX_GZH_ID');
    this.secret = this.configService.get('WX_GZH.WX_GZH_SECRET');
    this.token = this.configService.get('WX_GZH.WX_GZH_TOKEN');
    this.aesKey = this.configService.get('WX_GZH.WX_GZH_AES_KEY');
  }

  /**
   *  获取access_token
   * @returns
   */
  private async getAccessToken(): Promise<string> {
    try {
      const orgValue: string = await this.redisService.get(
        `${this.appId}:access_token`,
      );
      if (orgValue) return orgValue;

      const url = `https://api.weixin.qq.com/cgi-bin/stable_token`;
      const result: {
        data: {
          access_token: string;
          expires_in: number;
          errcode: number;
          errmsg: string;
        };
      } = await axios.post(url, {
        grant_type: 'client_credential',
        appid: this.appId,
        secret: this.secret,
      });

      if (!!result.data.errcode)
        throw new Error(result.data.errcode + '---' + result.data.errmsg);

      if (result.data.access_token) {
        await this.redisService.setKey(
          `${this.appId}:access_token`,
          result.data.access_token,
          result.data.expires_in,
        );
      }

      return result.data.access_token;
    } catch (error: any) {
      console.log('--------- getAccessToken ---- error', error);

      return '';
    }
  }

  /**
   * 创建二维码
   * @returns
   */
  async createQrcode(sceneStr: string): Promise<string> {
    const orgValue: string = await this.redisService.get(
      `${this.appId}:create_qrcode_ticket:${sceneStr}`,
    );
    if (orgValue) return orgValue;

    const accessToken = await this.getAccessToken();
    if (!accessToken) return '';

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`;
      const result: {
        data: {
          errcode: number;
          errmsg: string;
          ticket: string;
          expire_seconds: number;
          url: string;
        };
      } = await axios.post(url, {
        expire_seconds: 60 * 8,
        action_name: 'QR_STR_SCENE',
        action_info: { scene: { scene_str: sceneStr } },
      });

      if (!!result.data.errcode)
        throw new Error(result.data.errcode + '---' + result.data.errmsg);

      if (!!result.data.ticket) {
        await this.redisService.setKey(
          `${this.appId}:create_qrcode_ticket:${sceneStr}`,
          result.data.ticket,
          result.data.expire_seconds,
        );
      }

      return result.data.ticket;
    } catch (error) {
      console.log('--------- createQrcode ---- error', error);
      return '';
    }
  }

  /**
   * 提供给微信进行验证
   * @returns
   */
  async checkCallback(param: {
    signature: string;
    echostr: string;
    timestamp: string;
    nonce: string;
  }): Promise<string> {
    const { signature, echostr, timestamp, nonce } = param;

    // 将 token、timestamp、nonce三个参数按字典序排序
    const str = [this.token, timestamp, nonce].sort().join('');

    // 加密字符串, 建议使用 sha1加密
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    const sha1Str = sha1.digest('hex');

    if (sha1Str === signature) {
      console.log('验证成功');
      return echostr;
    } else {
      return 'error';
    }
  }

  async doMsg(
    param: {
      signature: string;
      timestamp: string;
      nonce: string;
    },
    xml: {
      ToUserName: string;
      FromUserName: string;
      CreateTime: string;
      MsgType: string;
      Event: string;
      EventKey: string;
    },
  ): Promise<string> {
    return '';
  }
}
