import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { fileUrlToBase64, streamDownloadAndUpload } from '@/common';
import { config } from '@/config';
import {
  KwaiAccessTokenResponse,
  KwaiPublishVideoInfo,
  KwaiStartUpload,
  KwaiUserInfo,
  KwaiVideoPubParams,
  KwaiVideoPubResult,
} from './kwaiApi.interfaces';

@Injectable()
export class KwaiApiService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly authBackHost;
  // 快手开放平台地址
  private kwaiHost = 'https://open.kuaishou.com';
  private readonly logger = new Logger(KwaiApiService.name);

  constructor() {
    const cfg = config.kwai;
    this.appId = cfg.id;
    this.appSecret = cfg.secret;
    this.authBackHost = cfg.authBackHost;
  }

  /**
   * 刷新token
   * @param refresh_token
   */
  async refreshToken(refresh_token: string) {
    try {
      const res = await axios<KwaiAccessTokenResponse>({
        url: `${this.kwaiHost}/oauth2/refresh_token`,
        params: {
          app_id: this.appId,
          app_secret: this.appSecret,
          refresh_token,
          grant_type: 'refresh_token',
        },
      });
      return res.data;
    }
    catch (e) {
      this.logger.error(e);
      throw new Error('快手刷新token失败');
    }
  }

  /**
   * 获取登陆授权页
   * @param taskId
   * @param type 'h5' | 'pc'
   */
  getAuthPage(taskId: string, type: 'h5' | 'pc') {
    const params = new URLSearchParams({
      app_id: this.appId,
      scope: 'user_info,user_video_publish',
      response_type: 'code',
      ...(type === 'pc' ? { ua: 'pc' } : {}),
      redirect_uri: `${this.authBackHost}/${taskId}`,
    });
    const authParams = params.toString();
    return `${this.kwaiHost}/oauth2/authorize?${authParams}`;
  }

  /**
   * 根据code获取快手账号的accessToken和refresh_token
   * @param code
   */
  async getLoginAccountToken(code: string) {
    try {
      const res = await axios<KwaiAccessTokenResponse>({
        url: `${this.kwaiHost}/oauth2/access_token`,
        method: 'POST',
        params: {
          app_id: this.appId,
          app_secret: this.appSecret,
          code,
          grant_type: 'authorization_code',
        },
      });
      if (res.data?.result !== 1)
        throw new Error('快手accessToken 获取失败！');
      return res.data;
    }
    catch (e) {
      this.logger.error(e);
      throw new Error('快手获取快手token失败');
    }
  }

  /**
   * 获取快手账号信息
   * @param accessToken
   */
  async getAccountInfo({ accessToken }: { accessToken: string }) {
    try {
      const res = await axios<{
        result: number;
        user_info: KwaiUserInfo;
      }>({
        url: `${this.kwaiHost}/openapi/user_info`,
        params: {
          app_id: this.appId,
          access_token: accessToken,
        },
      });
      if (!res.data.user_info)
        throw new Error('快手获取快手账号信息失败！');
      return res.data.user_info;
    }
    catch (e) {
      this.logger.error(e);
      throw new Error('快手获取快手账号信息失败');
    }
  }

  /**
   * 发起上传
   */
  async startUpload(accessToken: string) {
    try {
      Logger.log('startUpload');
      const res = await axios<KwaiStartUpload>({
        url: `${this.kwaiHost}/openapi/photo/start_upload`,
        method: 'POST',
        params: {
          app_id: this.appId,
          access_token: accessToken,
        },
      });
      Logger.log('startUpload111111111111');
      return res.data;
    }
    catch (e) {
      this.logger.error(e);
      throw new Error('快手发起上传失败');
    }
  }

  /**
   * 上传视频 - 分片上传
   * @param upload_token 需通过 {@link startUpload} 方法获得
   * @param endpoint 需通过 {@link startUpload} 方法获得
   * @param fragment_id 分片id 从0开始
   * @param video 分片视频的 {@link ArrayBuffer}
   */
  async fragmentUploadVideo(
    upload_token: string,
    fragment_id: number,
    endpoint: string,
    video: ArrayBuffer,
  ) {
    try {
      const res = await axios<{
        result: number;
      }>({
        url: `http://${endpoint}/api/upload/fragment`,
        method: 'POST',
        params: {
          fragment_id,
          upload_token,
        },
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        data: video,
      });
      return res.data;
    }
    catch (e) {
      this.logger.error(e);
      throw new Error('快手分片上传失败');
    }
  }

  /**
   * 完成分片上传
   * @param upload_token upload_token 需通过 {@link startUpload} 方法获得}
   * @param fragment_count 分片总数
   * @param endpoint 需通过 {@link startUpload} 方法获得
   */
  async completeFragmentUpload(
    upload_token: string,
    fragment_count: number,
    endpoint: string,
  ) {
    try {
      const res = await axios<{
        // 1 成功
        result: number;
      }>({
        url: `http://${endpoint}/api/upload/complete`,
        method: 'POST',
        params: {
          fragment_count,
          upload_token,
        },
      });
      return res.data;
    }
    catch (e) {
      this.logger.error(e);
      throw new Error('快手完成分片上传失败');
    }
  }

  // 处理描述和话题，获取caption
  getCaption(params: KwaiVideoPubParams) {
    const { describe, topics } = params;
    let caption = '';

    if (describe) {
      caption += `${describe} `;
    }

    if (topics && topics.length !== 0) {
      for (const topic of topics) {
        caption += `#${topic} `;
      }
    }

    return caption.trim();
  }

  /**
   * 视频发布 发布视频接口为异步发布，该接口返回结果后，不代表视频已经同步发布到用户P页。如关心最终发布结果，需要自行判断。
   * @param accountToken
   * @param pubParams 视频发布参数
   */
  publishVideo(
    accountToken: string,
    pubParams: KwaiVideoPubParams,
  ): Promise<KwaiVideoPubResult> {
    return new Promise(async (resolve) => {
      try {
        const { coverUrl, videoUrl } = pubParams;

        // 发起上传
        const startUploadInfo = await this.startUpload(accountToken);
        if (startUploadInfo.result !== 1)
          throw new Error('发起上传失败');

        // 获取封面
        const coverBase64 = await fileUrlToBase64(coverUrl);

        const buffer = Buffer.from(coverBase64, 'base64');
        const coverBlob = new Blob([buffer], { type: 'image/jpeg' });

        Logger.log('封面获取成功：', coverBlob);

        // 视频URL分片上传
        void streamDownloadAndUpload(
          videoUrl,
          async (upData: Buffer, partNumber: number) => {
            const res = await this.fragmentUploadVideo(
              startUploadInfo.upload_token,
              partNumber - 1,
              startUploadInfo.endpoint,
              upData,
            );
            Logger.log('分片：', partNumber, res);
            if (res.result !== 1)
              throw new Error('分片上传失败');
          },
          async (partCount) => {
            // 合并
            const res = await this.completeFragmentUpload(
              startUploadInfo.upload_token,
              partCount - 1,
              startUploadInfo.endpoint,
            );
            if (res.result !== 1)
              throw new Error('合并分片上传失败');

            // 发布
            const formData = new FormData();
            formData.append('caption', this.getCaption(pubParams));
            formData.append('cover', coverBlob);
            const pubRes = await axios<{
              video_info: KwaiPublishVideoInfo;
              result: number;
            }>({
              url: `${this.kwaiHost}/openapi/photo/publish`,
              method: 'POST',
              params: {
                upload_token: startUploadInfo.upload_token,
                app_id: this.appId,
                access_token: accountToken,
              },
              data: formData,
            });
            if (pubRes.data.result !== 1)
              throw new Error('视频发布失败！');

            resolve({
              success: true,
              worksId: pubRes.data.video_info.photo_id,
            });
          },
          4194304,
        );
      }
      catch (e) {
        this.logger.error(e);
        resolve({
          success: false,
          failMsg: e.message || '发布错误',
        });
      }
    });
  }
}
