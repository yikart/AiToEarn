/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: b站
 */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createHash, createHmac } from 'crypto';
import { AccessToken, BClient, VideoUTypes } from './comment';
import { ConfigService } from '@nestjs/config';
import { getRandomString } from 'src/util';
import { RedisService } from 'src/lib/redis/redis.service';
import { getCurrentTimestamp } from 'src/util/time.util';
@Injectable()
export class BilibiliService {
  private clientId = '';
  private clientSecret = '';
  private clientName = '';
  private authBackUrl = '';
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const cfg = this.configService.get<BClient>('BILIBILI_CONFIG');
    this.clientId = cfg.clientId;
    this.clientSecret = cfg.clientSecret;
    this.clientName = cfg.clientName;
    this.authBackUrl = cfg.authBackUrl;
  }

  /**
   * 获取用户的授权链接
   * @param userId
   * @returns
   */
  async getAuthUrl(userId: string, type: 'h5' | 'pc') {
    const gourl = encodeURIComponent(
      `${this.authBackUrl}/api/plat/bilibili/auth/back/${userId}`,
    );

    const state = getRandomString(8);

    this.redisService.setKey(`bilibili:state:${state}`, { userId }, 60 * 5);

    if (type === 'h5')
      return `https://account.bilibili.com/h5/account-h5/auth/oauth?navhide=1&callback=close&gourl=${gourl}&client_id=${this.clientId}&state=${state}`;

    return `https://account.bilibili.com/pc/account-pc/auth/oauth?client_id=${this.clientId}&gourl=${gourl}&state=${state}`;
  }

  /**
   * 设置用户的授权Token
   * @param data
   * @returns
   */
  async setUserAccessToken(data: {
    code: string;
    userId: string;
    state: string;
  }) {
    const { code, userId, state } = data;

    const query = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
    };

    const stateData = await this.redisService.get(`bilibili:state:${state}`);
    if (!stateData || stateData.userId !== userId) return false;

    try {
      const result = await axios.post<{
        code: number; // 0;
        message: string; // '0';
        ttl: number; // 1;
        data: AccessToken;
      }>('https://api.bilibili.com/x/account-oauth2/v1/token', null, {
        params: query,
      });

      const accessTokenInfo = result.data.data;

      // 剩余有效秒数
      const expires =
        accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;

      this.redisService.setKey(
        `bilibili:accessToken:${userId}`,
        accessTokenInfo,
        expires,
      );

      return true;
    } catch (error) {
      console.log('Error during getUserAccessToken:', error);
      return false;
    }
  }

  async getUserAccessToken(userId: string): Promise<string> {
    const res: AccessToken = await this.redisService.get(
      `bilibili:accessToken:${userId}`,
    );
    if (!res) return '';

    // 剩余时间
    const overTime = res.expires_in - getCurrentTimestamp();

    if (overTime < 60 * 60 && overTime > 0) {
      // 刷新token
      this.refreshAccessToken(userId, res.refresh_token);
    }

    return res.access_token;
  }

  /**
   * 刷新授权Token
   * @param userId
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(userId: string, refreshToken: string) {
    const query = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };

    const url = `https://api.bilibili.com/x/account-oauth2/v1/refresh_token`;
    try {
      const result = await axios.post<{
        code: number; // 0;
        message: string; // '0';
        ttl: number; // 1;
        data: AccessToken;
      }>(url, null, { params: query });

      const accessTokenInfo = result.data.data;

      // 剩余有效秒数
      const expires =
        accessTokenInfo.expires_in - getCurrentTimestamp() - 60 * 60;

      this.redisService.setKey(
        `bilibili:accessToken:${userId}`,
        accessTokenInfo,
        expires,
      );

      return true;
    } catch (error) {
      console.log('Error during getAccessToken:', error);
      return false;
    }
  }

  /**
   * 查询用户已授权权限列表
   * @returns
   */
  async getAccountScopes(accessToken: string) {
    const url = `https://member.bilibili.com/arcopen/fn/user/account/scopes`;
    const result = await axios.get<{
      code: number; // 0;
      message: string; // '0';
      ttl: number; // 1;
      data: {
        openid: string; // 'd30bedaa4d8eb3128cf35ddc1030e27d';
        scopes: string[]; // ['USER_INFO', 'ATC_DATA', 'ATC_BASE'];
      };
    }>(url, {
      headers: this.generateBilibiliHeader({
        accessToken,
        isForm: true,
      }),
    });

    return result.data.data;
  }

  /**
   * 生成请求头
   * @param data
   */
  private generateBilibiliHeader(data: {
    accessToken: string;
    body?: { [key: string]: any };
    isForm?: boolean;
  }) {
    const { accessToken, body, isForm } = data;
    const xBiliContentMd5 = body
      ? createHash('md5').update(JSON.stringify(body)).digest('hex')
      : '';

    const header = {
      Accept: 'application/json',
      'Content-Type': isForm ? 'multipart/form-data' : 'application/json', // 或者 multipart/form-data
      'x-bili-content-md5': xBiliContentMd5,
      'x-bili-timestamp': Math.floor(Date.now() / 1000),
      'x-bili-signature-method': 'HMAC-SHA256',
      'x-bili-signature-nonce': uuidv4(),
      'x-bili-accesskeyid': this.clientId,
      'x-bili-signature-version': '1.0',
      'access-token': accessToken, // 需要在请求头中添加access-token
      Authorization: '',
    };

    // 抽取带”x-bili-“前缀的自定义header，按字典排序拼接，构建完整的待签名字符串：
    // 待签名字符串包含换行符\n
    const headerStr = Object.keys(header)
      .filter((key) => key.startsWith('x-bili-'))
      .sort()
      .map((key) => `${key}:${header[key]}\n`)
      .join('');

    // 使用 createHmac 正确创建签名
    const signature = createHmac('sha256', this.clientSecret)
      .update(headerStr)
      .digest('hex');

    // 将签名加入 header
    header.Authorization = signature;

    return header;
  }

  /**
   * 视频初始化
   * @param fileName
   * @param utype // 1-单个小文件（不超过100M）。默认值为0
   * @returns
   */
  async videoInit(fileName: string, utype: VideoUTypes = 0): Promise<string> {
    const body = {
      name: fileName, // test.mp4
      utype,
    };

    const url = `https://member.bilibili.com/arcopen/fn/archive/video/init`;
    const result = await axios.post<{
      code: number; // 0;
      message: string; // '0';
      ttl: number; // 1;
      request_id: string; // '7b753a287405461f5afa526a1f672094';
      data: {
        upload_token: string; // 'd30bedaa4d8eb3128cf35ddc1030e27d';
      };
    }>(url, body);
    return result.data.data.upload_token;
  }

  /**
   * 封面上传
   * @param accessToken
   * @param file
   * @returns
   */
  async coverUpload(
    accessToken: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/cover/upload`;

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    const result = await axios.post<{
      code: number; // 0;
      message: string; // '0';
      ttl: number; // 1;
      request_id: string; // '7b753a287405461f5afa526a1f672094';
      data: {
        url: string; // "https://archive.biliimg.com/bfs/..."
      };
    }>(url, formData, {
      headers: this.generateBilibiliHeader({
        accessToken: accessToken,
        isForm: true,
      }),
    });
    return result.data.data.url;
  }

  /**
   * 视频稿件提交
   * @param accessToken
   * @param uploadToken
   * @param data
   * @returns
   */
  async archiveAddByUtoken(
    accessToken: string,
    uploadToken: string,
    data: {
      title: string; // 标题
      cover?: string; // 封面url
      tid: number; // 分区ID，由获取分区信息接口得到
      no_reprint?: 0 | 1; // 是否允许转载 0-允许，1-不允许。默认0
      desc?: string; // 描述
      tag: string; // 标签, 多个标签用英文逗号分隔，总长度小于200
      copyright: 1 | 2; // 1-原创，2-转载(转载时source必填)
      source?: string; // 如果copyright为转载，则此字段表示转载来源
      topic_id?: number; // 参加的话题ID，默认情况下不填写，需要填写和运营联系
    },
  ): Promise<string> {
    const url = `https://member.bilibili.com/arcopen/fn/archive/add-by-utoken`;

    const result = await axios.post<{
      code: number; // 0;
      message: string; // '0';
      ttl: number; // 1;
      data: {
        resource_id: string; // 'BV17B4y1s7R1';
      };
    }>(url, data, {
      headers: this.generateBilibiliHeader({
        accessToken,
      }),
      params: {
        upload_token: uploadToken,
      },
    });
    return result.data.data.resource_id;
  }

  /**
   * 分区查询
   * @param accessToken
   * @returns
   */
  async archiveTypeList(accessToken: string) {
    const url = `https://member.bilibili.com/arcopen/fn/archive/type/list`;

    const result = await axios.get<{
      code: number; // 0;
      message: string; // '0';
      ttl: number; // 1;
      request_id: string; // '35f4a1e0d3765a92510f919d0b6721dd';
      data: any;
    }>(url, {
      headers: this.generateBilibiliHeader({
        accessToken,
      }),
    });
    return result.data.data;
  }
}
