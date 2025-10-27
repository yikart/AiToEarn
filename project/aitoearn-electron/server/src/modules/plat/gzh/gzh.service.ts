/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 17:58:21
 * @LastEditors: nevin
 * @Description: gzh Gzh 公众号
 */
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createHash, createHmac } from 'crypto';
import { VideoUTypes } from './comment';

@Injectable()
export class GzhService {
  private componentAppid = '';
  private componentAppsecret = '';
  constructor() {}

  /**
   * 获取授权Token
   * @param ticket 票据
   * @returns
   */
  async getComponentAccessToken(ticket: string) {
    const url = `https://api.weixin.qq.com/cgi-bin/component/api_component_token`;
    const result = await axios.post<{
      component_access_token: string; // 'd30bedaa4d8eb3128cf35ddc1030e27d';
      expires_in: number; // 1630220614;
    }>(url, {
      component_appid: this.componentAppid,
      component_appsecret: this.componentAppsecret,
      component_verify_ticket: ticket,
    });

    return result.data;
  }

  /**
   * 刷新授权Token
   * @param refreshToken
   * @returns
   */
  async refreshAccessToken(refreshToken: string) {
    return null;
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
    const signature = createHmac('sha256', '').update(headerStr).digest('hex');

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
   * 公众号素材发布
   * @param accessToken
   * @param mediaId
   * @returns
   */
  async freepublishSubmit(
    accessToken: string,
    mediaId: string,
  ): Promise<string> {
    const url = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`;

    const result = await axios.post<{
      errcode: number; // 0;
      errmsg: string; // 'ok';
      publish_id: string; // '100000001';
    }>(
      url,
      {
        media_id: mediaId,
      },
      {
        headers: this.generateBilibiliHeader({
          accessToken,
        }),
      },
    );
    return result.data.publish_id;
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
