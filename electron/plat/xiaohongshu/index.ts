import { screen, BrowserWindow, net, session } from 'electron';
import * as crypto from 'crypto';
import sizeOf from 'image-size';
import { CommonUtils } from '../../util/common';
import { FileUtils } from '../../util/file';
import { CookieToString, getFileContent } from '../utils';
import requestNet from '../requestNet';
import {
  IXHSLocationResponse,
  IXHSTopicsResponse,
  XiaohongshuApiResponse,
} from './xiaohongshu.type';

export class XiaohongshuService {
  private defaultUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  private loginUrl = 'https://creator.xiaohongshu.com/';
  // private loginUrl = 'https://www.xiaohongshu.com/';
  private getUserInfoUrl =
    'https://creator.xiaohongshu.com/api/galaxy/user/info';
  private getDashboardUrl =
    'https://creator.xiaohongshu.com/api/galaxy/v2/creator/datacenter/account/base';
  private getFansInfoUrl =
    'https://creator.xiaohongshu.com/api/galaxy/creator/home/personal_info';
  private getUploadPermitUrl =
    'https://creator.xiaohongshu.com/api/media/v1/upload/web/permit';
  private postCreateVideoUrl =
    'https://edith.xiaohongshu.com/web_api/sns/v2/note';
  private fileBlockSize = 5242880;
  private cookieCheckField = 'access-token';
  // private cookieCheckField = 'web_session';
  private cookieIntervalList: { [key: string]: NodeJS.Timer } = {};
  private prev_web_session = '';

  /**
   * 授权|预览
   */
  async loginOrView(
    authModel: 'login' | 'view',
    cookies?: any,
  ): Promise<{
    success: boolean;
    data?: { cookie: any; userInfo: any };
    error?: string;
  }> {
    console.log('Start login process:', { authModel, cookies });
    try {
      const winRes = await this.createAuthorizationWindow(
        authModel === 'view' ? cookies : null,
      );
      const { winContentsId, partition } = winRes;
      const newCookies = await this.filterCookie(winContentsId, partition);
      const userInfo = await this.getUserInfo(newCookies);
      if (authModel === 'login') {
        const winBrowserWindow = BrowserWindow.fromId(winContentsId);
        winBrowserWindow?.close();
        this.prev_web_session = '';
      }

      const result = {
        success: true,
        data: {
          cookie: newCookies,
          userInfo: userInfo,
        },
      };
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * 创建授权窗口
   */
  private async createAuthorizationWindow(cookies: any = null) {
    // 生成随机partition
    const partition = Date.now().toString();

    // 获取屏幕尺寸
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // 创建窗口
    const win = new BrowserWindow({
      width: Math.ceil(width * 0.8),
      height: Math.ceil(height * 0.8),
      show: false,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: false,
        partition: partition,
      },
    });
    win.show();

    // 设置用户代理
    win.webContents.setUserAgent(this.defaultUserAgent);

    // 如果有cookies，设置cookies
    if (cookies) {
      const parsedCookies =
        typeof cookies === 'string' ? JSON.parse(cookies) : cookies;
      for (const cookie of parsedCookies) {
        await session.fromPartition(partition).cookies.set({
          url: this.loginUrl,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
        });
      }
    }

    // 加载登录页
    await win.loadURL(this.loginUrl);

    return {
      winContentsId: win.id,
      partition,
    };
  }

  /**
   * Filter and monitor cookies until login is detected
   */
  private async filterCookie(
    winContentsId: number,
    partition: string,
  ): Promise<Electron.Cookie[]> {
    return new Promise((resolve, reject) => {
      // Monitor cookie status with interval
      this.cookieIntervalList[winContentsId] = setInterval(async () => {
        try {
          const cookies = await session.fromPartition(partition).cookies.get({
            url: this.loginUrl,
          });
          // const web_session = cookies.find((v) => v.name === 'web_session');
          // if (!this.prev_web_session) {
          //   this.prev_web_session = web_session?.value || '';
          // }
          /**
           * 因为小红书的cookie字段始终存在
           * 所以判断cookie是否进行更改
           */
          // if (this.prev_web_session === (web_session?.value || '')) return;

          const alreadyLogin = cookies.some((cookie) => {
            return cookie.name.includes(this.cookieCheckField);
          });
          if (alreadyLogin) {
            // Clear interval
            if (this.cookieIntervalList[winContentsId]) {
              clearInterval(this.cookieIntervalList[winContentsId] as any);
              delete this.cookieIntervalList[winContentsId];
            }

            resolve(cookies);
          }
        } catch (error) {
          // Clear interval on error
          if (this.cookieIntervalList[winContentsId]) {
            clearInterval(this.cookieIntervalList[winContentsId] as any);
            delete this.cookieIntervalList[winContentsId];
          }
          console.error('Failed to get cookies:', error);
          reject(new Error('Failed to get website cookies'));
        }
      }, 3000); // Check every 3 seconds
    });
  }

  /**
   * Cleanup method to clear any remaining intervals
   */
  private clearCookieIntervals() {
    Object.entries(this.cookieIntervalList).forEach(([winId, interval]) => {
      clearInterval(interval as any);
      delete this.cookieIntervalList[winId];
    });
  }

  /**
   * Override class destructor to ensure cleanup
   */
  public destroy() {
    this.clearCookieIntervals();
  }

  /**
   * 获取用户信息
   */
  public async getUserInfo(cookies: Electron.Cookie[]) {
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    const userInfo = await this.makeRequest(this.getUserInfoUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieString,
        Referer: this.loginUrl,
      },
    });

    const fansInfo = await this.makeRequest(this.getFansInfoUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieString,
        Referer: this.loginUrl,
      },
    });

    return {
      authorId: userInfo.data.userId || '',
      nickname: userInfo.data.userName || '',
      avatar: userInfo.data.userAvatar || '',
      fansCount: fansInfo.data.fans_count || 0,
    };
  }

  /**
   * 获取账户数据
   */
  public async getDashboardFunc(
    cookies: Electron.Cookie[],
    startDate?: string,
    endDate?: string,
  ) {
    // 初始化cookie
    const cookieString = CommonUtils.convertCookieToJson(cookies);
    console.log('cookieString', cookieString);

    // 获取cookie_a1
    const cookieObject = cookies;
    let cookie_a1 = null;
    for (const cookieItem of cookieObject) {
      if (cookieItem.name === 'a1') {
        cookie_a1 = cookieItem.value;
        break;
      }
    }

    console.log('cookie_a1', cookie_a1);

    const reverseRes: any = await this.getReverseResult({
      url: '/api/galaxy/v2/creator/datacenter/account/base',
      a1: cookie_a1,
    });

    console.log('reverseRes', reverseRes);

    const userInfo = await this.makeRequest(this.getDashboardUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Cookie: cookieString,
        Referer: 'https://creator.xiaohongshu.com/statistics/account',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.36',
        'X-S': reverseRes['X-s'],
        'X-T': reverseRes['X-t'],
      },
    });

    console.log('userInfouserInfo', JSON.stringify(userInfo));

    if (userInfo.code == 0) {
      if (startDate && endDate) {
        // 处理30天的数据
        const dataList = [];
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();

        // 获取所有列表数据
        const rise_fans_list = userInfo.data.thirty.rise_fans_list || [];
        const view_list = userInfo.data.thirty.view_list || [];
        const comment_list = userInfo.data.thirty.comment_list || [];
        const like_list = userInfo.data.thirty.like_list || [];
        const home_view_list = userInfo.data.thirty.home_view_list || [];

        // 创建日期映射
        const dateMap: { [key: string]: any } = {};

        // 处理所有类型的数据
        [
          { list: rise_fans_list, key: 'zhangfen' },
          { list: view_list, key: 'bofang' },
          { list: comment_list, key: 'pinglun' },
          { list: like_list, key: 'dianzan' },
          { list: rise_fans_list, key: 'fenxiang' },
          { list: home_view_list, key: 'zhuye' },
        ].forEach(({ list, key }) => {
          list.forEach((item: any) => {
            const timestamp = item.date;
            // 检查日期是否在范围内
            if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
              if (!dateMap[timestamp]) {
                dateMap[timestamp] = {
                  date: new Date(timestamp).toISOString().split('T')[0],
                  zhangfen: 0,
                  bofang: 0,
                  pinglun: 0,
                  dianzan: 0,
                  fenxiang: 0,
                  zhuye: 0,
                };
              }
              dateMap[timestamp][key] = item.count;
            }
          });
        });

        // 转换为数组并排序
        const sortedData = Object.values(dateMap).sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        return {
          success: true,
          data: sortedData,
        };
      } else {
        // 保持原有的单日数据逻辑
        const data = {
          zhangfen: userInfo.data.seven.rise_fans_list[0].count,
          bofang: userInfo.data.seven.view_list[0].count,
          pinglun: userInfo.data.seven.comment_list[0].count,
          dianzan: userInfo.data.seven.like_list[0].count,
          fenxiang: userInfo.data.seven.rise_fans_list[0].count,
          zhuye: userInfo.data.seven.home_view_list[0].count,
        };

        return {
          success: true,
          data: [data],
        };
      }
    } else {
      return {
        success: false,
        data: userInfo,
      };
    }
  }

  /**
   * 通用请求方法
   */
  private async makeRequest(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: options.method,
        url: url,
        headers: options.headers,
      });

      // 发送请求体
      if (options.data) {
        // request.setHeader('Content-Type', 'application/json');
        request.write(
          typeof options.data === 'string'
            ? options.data
            : JSON.stringify(options.data),
        );
      }

      request.on('response', (response) => {
        console.log('Response status code:', response.statusCode);
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          const result = JSON.parse(data);
          if (result) {
            resolve(result);
          } else {
            console.error('Request failed:', result);
            reject(new Error(result.msg || 'Request failed'));
          }
        });
      });

      request.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      request.end();
    });
  }

  /**
   * 获取上传许可证
   * @param cookieString
   * @param scene
   */
  async getUploadPermit(cookieString: string, scene: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const permitRes = await this.makeRequest(
          this.getUploadPermitUrl +
            `?biz_name=spectrum&scene=${scene}&file_count=1&version=1&source=web`,
          {
            method: 'GET',
            headers: {
              Cookie: cookieString,
              Referer: this.loginUrl,
            },
          },
        );

        if (permitRes.code !== 0) {
          reject('获取上传许可证失败,失败原因:' + permitRes.msg);
        }

        const uploadTempPermits = permitRes.data.uploadTempPermits;
        resolve(uploadTempPermits);
      } catch (err: any) {
        let errorMessage;
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err) {
          errorMessage = err;
        } else {
          errorMessage = '未知';
        }
        reject('获取上传许可证失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 上传文件到远程服务器
   * @param url 上传地址
   * @param fileContent 文件内容
   * @param headers 请求头
   */
  private async uploadFile(
    url: string,
    fileContent: Buffer,
    headers: any,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: 'PUT',
        url: url,
        headers: headers,
      });

      request.on('response', (response) => {
        resolve(response);
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.write(fileContent);
      request.end();
    });
  }

  /**
   * 上传封面文件
   * @param cookieString
   * @param filePath
   */
  async uploadCoverFile(
    cookieString: string,
    filePath: string,
  ): Promise<{
    coverUploadFileId: string;
    coverDimensions: any;
    remotePreviewUrl: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 获取文件上传许可证
        const uploadPermit: any = await this.getUploadPermit(
          cookieString,
          'image',
        );
        const coverUploadFileId = uploadPermit[0].fileIds[0];
        const uploadAddr = uploadPermit[0].uploadAddr;
        const uploadToken = uploadPermit[0].token;
        const uploadBaseUrl = `https://${uploadAddr}/${coverUploadFileId}`;

        // 获取文件内容
        const fileContent = await getFileContent(filePath);
        console.log('fileContent length:', fileContent.length);

        // 获取宽高信息
        const coverDimensions = sizeOf(fileContent);

        // 直接上传
        let uploadRes = await this.uploadFile(uploadBaseUrl, fileContent, {
          Referer: this.loginUrl,
          'X-Cos-Security-Token': uploadToken,
        });

        uploadRes = uploadRes.headers;

        if (!uploadRes.hasOwnProperty('x-ros-preview-url')) {
          reject('上传封面失败,失败原因:未获取到previewUrl');
          return;
        }
        const remotePreviewUrl = uploadRes['x-ros-preview-url'];

        // 上传成功,返回结果
        resolve({
          coverUploadFileId,
          remotePreviewUrl,
          coverDimensions,
        });
      } catch (err: any) {
        let errorMessage;
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err) {
          errorMessage = err;
        } else {
          errorMessage = '未知';
        }
        reject('上传封面失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 文本响应专用请求方法
   */
  private async makeTextRequest(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: options.method,
        url: url,
        headers: options.headers,
      });

      // 发送请求体
      if (options.data) {
        request.write(
          typeof options.data === 'string'
            ? options.data
            : JSON.stringify(options.data),
        );
      }

      request.on('response', (response) => {
        console.log('Response status code:', response.statusCode);
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve({
            data,
            headers: response.headers,
            status: response.statusCode,
          });
        });
      });

      request.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      request.end();
    });
  }

  /**
   * 上传视频文件
   * @param cookieString
   * @param filePath
   * @param filePartInfo
   * @param fileInfo
   */
  private async uploadVideoFile(
    cookieString: string,
    filePath: string,
    filePartInfo: any,
    fileInfo: any,
  ): Promise<{
    uploadFileId: string;
    remotePreviewUrl: string;
    remoteVideoId: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 获取文件上传许可证
        const uploadPermit: any = await this.getUploadPermit(
          cookieString,
          'video',
        );
        const uploadFileId = uploadPermit[0].fileIds[0];
        const uploadAddr = uploadPermit[0].uploadAddr;
        const uploadToken = uploadPermit[0].token;
        const uploadBaseUrl = `https://${uploadAddr}/${uploadFileId}`;
        let remotePreviewUrl = '';
        let remoteVideoId = '';

        // 开始上传文件
        if (filePartInfo.blockInfo?.length === 1) {
          // 获取文件内容
          const fileContent = await FileUtils.getFilePartContent(
            filePath,
            0,
            filePartInfo.fileSize - 1,
          );
          // 直接上传
          let uploadRes = await this.uploadFile(uploadBaseUrl, fileContent, {
            'Content-Type': fileInfo.mimeType,
            Referer: this.loginUrl,
            'X-Cos-Security-Token': uploadToken,
          });

          uploadRes = uploadRes.headers;
          if (
            !uploadRes.hasOwnProperty('x-ros-preview-url') ||
            !uploadRes.hasOwnProperty('x-ros-video-id')
          ) {
            reject('上传视频失败,失败原因:未获取到videoId');
            return;
          }
          remotePreviewUrl = uploadRes['x-ros-preview-url'];
          remoteVideoId = uploadRes['x-ros-video-id'];
        } else {
          // 获取分片上传ID
          const uploadIdRes = await this.makeTextRequest(
            uploadBaseUrl + '?uploads',
            {
              method: 'POST',
              headers: {
                'Content-Type': fileInfo.mimeType,
                Referer: this.loginUrl,
                'X-Cos-Security-Token': uploadToken,
              },
            },
          );

          if (CommonUtils.isJsonString(uploadIdRes.data)) {
            const parsedRes = JSON.parse(uploadIdRes.data);
            reject('上传视频失败,失败原因:获取上传id失败:' + parsedRes.msg);
            return;
          }

          const parsedXml = (await CommonUtils.xml2json(uploadIdRes.data)) as {
            InitiateMultipartUploadResult: {
              UploadId: string[];
            };
          };
          const uploadId =
            parsedXml.InitiateMultipartUploadResult.UploadId[0] ?? '';
          if (uploadId === '') {
            reject('上传视频失败,失败原因:获取上传id失败');
            return;
          }

          // 分片上传文件
          const uploadPartInfo = [];
          for (const i in filePartInfo.blockInfo) {
            const chunkStart =
              i === '0' ? 0 : filePartInfo.blockInfo[parseInt(i) - 1];
            const chunkEnd = filePartInfo.blockInfo[i] - 1;
            const chunkContent = await FileUtils.getFilePartContent(
              filePath,
              chunkStart,
              chunkEnd,
            );

            // 开始上传
            const uploadPartRes = await this.uploadFile(
              uploadBaseUrl +
                `?uploadId=${uploadId}&partNumber=${parseInt(i) + 1}`,
              chunkContent,
              {
                Referer: this.loginUrl,
                'X-Cos-Security-Token': uploadToken,
              },
            );

            const headers = uploadPartRes.headers;
            if (!headers.hasOwnProperty('etag') || headers['etag'] === '') {
              reject('上传视频失败,失败原因:上传分片失败');
              return;
            }

            // 分片上传成功
            uploadPartInfo.push({
              Part: {
                PartNumber: parseInt(i) + 1,
                ETag: headers['etag'],
              },
            });
          }

          // 合并分片
          const completeXml = await CommonUtils.json2xml(uploadPartInfo);
          const completeRes = await this.makeTextRequest(
            uploadBaseUrl + `?uploadId=${uploadId}`,
            {
              method: 'POST',
              headers: {
                Referer: this.loginUrl,
                'X-Cos-Security-Token': uploadToken,
                'Content-Type': 'application/xml',
              },
              data: completeXml,
            },
          );

          if (CommonUtils.isJsonString(completeRes.data)) {
            const parsedRes = JSON.parse(completeRes.data);
            reject('上传视频失败,失败原因:合并分片失败:' + parsedRes.msg);
            return;
          }

          const headers = completeRes.headers;
          if (
            !headers.hasOwnProperty('x-ros-preview-url') ||
            !headers.hasOwnProperty('x-ros-video-id')
          ) {
            reject('上传视频失败,失败原因:未获取到videoId');
            return;
          }

          remotePreviewUrl = headers['x-ros-preview-url'];
          remoteVideoId = headers['x-ros-video-id'];
        }

        // 上传成功,返回结果
        resolve({
          uploadFileId: uploadFileId,
          remotePreviewUrl: remotePreviewUrl,
          remoteVideoId: remoteVideoId,
        });
      } catch (err: any) {
        let errorMessage;
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err) {
          errorMessage = err;
        } else {
          errorMessage = '未知';
        }
        reject('上传视频失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 图文作品发布
   * @param cookies
   * @param tokens
   * @param imagePath
   * @param platformSetting
   */
  async publishImageWorkApi(
    cookies: string,
    imagePath: string[],
    platformSetting: any,
  ) {
    return new Promise(async (resolve, reject) => {
      // try {
      // 初始化cookie
      const cookieString = CommonUtils.convertCookieToJson(cookies);
      console.log('cookieString', cookieString);
      // 上传图片
      const uploadImgRet = [];
      for (const imgUrl of imagePath) {
        // 上传图片, 获取远程Url
        const imgRet = await this.uploadCoverFile(cookieString, imgUrl);
        // 添加到成功列表
        uploadImgRet.push(imgRet);
      }
      // 获取cookie_a1
      const cookieObject = JSON.parse(cookies);
      let cookie_a1 = null;
      for (const cookieItem of cookieObject) {
        if (cookieItem.name === 'a1') {
          cookie_a1 = cookieItem.value;
          break;
        }
      }
      // 创建作品
      const uploadResult = {
        imageList: uploadImgRet,
      };
      const { shareLink, publishId } = (await this.postCreateVideo(
        cookieString,
        cookie_a1,
        'image',
        uploadResult,
        platformSetting,
      )) as any;
      console.log('shareLink', shareLink);
      console.log('publishId', publishId);
      // 返回信息
      resolve({
        publishTime: Math.floor(Date.now() / 1000),
        publishId: publishId,
        shareLink: shareLink,
      });
    });
  }

  /**
   * 创建视频作品
   * @param cookieString
   * @param cookie_a1
   * @param publishType
   * @param uploadResult {uploadFileId, uploadCoverId, coverDimensions, fileInfo}
   * @param platformSetting
   * @returns {Promise<unknown>}
   */
  async postCreateVideo(
    cookieString: string,
    cookie_a1: string,
    publishType: 'video' | 'image',
    uploadResult: any,
    platformSetting: any,
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        let xhs_video_info = null;
        let xhs_image_info = null;
        // 如果是发布视频,则需要获取视频元信息
        if (publishType === 'video') {
          // 获取视频|音频元信息
          let videoInfos = null;
          let audioInfos = null;
          for (const info of uploadResult.fileInfo.streams) {
            if (
              info.hasOwnProperty('codec_type') &&
              info.codec_type === 'video'
            ) {
              videoInfos = info;
            }
            if (
              info.hasOwnProperty('codec_type') &&
              info.codec_type === 'audio'
            ) {
              audioInfos = info;
            }
          }
          if (!videoInfos || !audioInfos) {
            reject('创建作品失败,失败原因:获取视频、音频元信息失败!');
            return;
          }
          // 拼凑视频发布参数
          xhs_video_info = {
            fileid: uploadResult.uploadFileId,
            file_id: uploadResult.uploadFileId,
            format_width: videoInfos.width,
            format_height: videoInfos.height,
            video_preview_type:
              videoInfos.height > videoInfos.width
                ? 'full_vertical_screen'
                : '',
            composite_metadata: {
              video: {
                bitrate: videoInfos.bit_rate ?? '',
                colour_primaries: videoInfos.color_primaries ?? '',
                duration: Math.floor(videoInfos.duration * 1000) ?? '',
                format: videoInfos.codec_long_name.split('/')[1].trim() ?? '',
                frame_rate: videoInfos.r_frame_rate.split('/')[0] ?? '',
                height: videoInfos.height,
                matrix_coefficients: videoInfos.color_primaries ?? '',
                rotation: 0,
                transfer_characteristics: videoInfos.color_primaries ?? '',
                width: videoInfos.width,
              },
              audio: {
                bitrate: audioInfos.bit_rate,
                channels: audioInfos.channels,
                duration: Math.floor(audioInfos.duration * 1000) ?? '',
                format: audioInfos.codec_name.toUpperCase(),
                sampling_rate: audioInfos.sample_rate,
              },
            },
            timelines: [],
            cover: {
              fileid: uploadResult.uploadCoverId,
              file_id: uploadResult.uploadCoverId,
              height: uploadResult.coverDimensions.height,
              width: uploadResult.coverDimensions.width,
              frame: {
                ts: 0,
                is_user_select: false,
                is_upload: true,
              },
            },
            chapters: [],
            chapter_sync_text: false,
            segments: {
              count: 1,
              need_slice: false,
              items: [
                {
                  mute: 0,
                  speed: 1,
                  start: 0,
                  duration: videoInfos.duration,
                  transcoded: 0,
                  media_source: 1,
                  original_metadata: {
                    video: {
                      bitrate: videoInfos.bit_rate ?? '',
                      colour_primaries: videoInfos.color_primaries ?? '',
                      duration: Math.floor(videoInfos.duration * 1000) ?? '',
                      format:
                        videoInfos.codec_long_name.split('/')[1].trim() ?? '',
                      frame_rate: videoInfos.r_frame_rate.split('/')[0] ?? '',
                      height: videoInfos.height,
                      matrix_coefficients: videoInfos.color_primaries ?? '',
                      rotation: 0,
                      transfer_characteristics:
                        videoInfos.color_primaries ?? '',
                      width: videoInfos.width,
                    },
                    audio: {
                      bitrate: audioInfos.bit_rate,
                      channels: audioInfos.channels,
                      duration: Math.floor(audioInfos.duration * 1000) ?? '',
                      format: audioInfos.codec_name.toUpperCase(),
                      sampling_rate: audioInfos.sample_rate,
                    },
                  },
                },
              ],
            },
            entrance: 'web',
            backup_covers: [],
          };
        } else {
          const images = [];
          // 拼凑图文发布参数
          for (const imgInfo of uploadResult.imageList) {
            images.push({
              file_id: imgInfo.coverUploadFileId,
              width: imgInfo.coverDimensions.width,
              height: imgInfo.coverDimensions.height,
              metadata: {
                source: -1,
              },
              stickers: {
                version: 2,
                floating: [],
              },
              extra_info_json: JSON.stringify({
                mimeType:
                  'image/' + imgInfo.coverDimensions.type === 'jpg'
                    ? 'jpeg'
                    : imgInfo.coverDimensions.type,
              }),
            });
          }
          xhs_image_info = {
            images: images,
          };
        }
        // 处理标题、@好友、话题
        let description = platformSetting['desc'] ?? '';
        const hashTag = [];
        if (
          platformSetting.hasOwnProperty('topicsDetail') &&
          platformSetting.topicsDetail?.length > 0
        ) {
          for (const topicInfo of platformSetting.topicsDetail) {
            description += ` #${topicInfo.topicName}[话题]# `;
            hashTag.push({
              id: topicInfo.topicId,
              name: topicInfo.topicName,
              link: topicInfo.topicLink,
              type: 'topic',
            });
          }
        }
        const ats = [];
        if (
          platformSetting.hasOwnProperty('mentionedUserInfo') &&
          platformSetting.mentionedUserInfo?.length > 0
        ) {
          for (const userInfo of platformSetting.mentionedUserInfo) {
            if (
              userInfo.hasOwnProperty('nickName') &&
              userInfo.nickName !== '' &&
              userInfo.hasOwnProperty('uid') &&
              userInfo.uid !== ''
            ) {
              description += ` @${userInfo.nickName} `;
              ats.push({
                nickname: userInfo.nickName,
                user_id: userInfo.uid,
                name: userInfo.nickName,
              });
            }
          }
        }
        // 处理POI
        let post_loc = {};
        if (
          platformSetting.hasOwnProperty('poiInfo') &&
          typeof platformSetting.poiInfo === 'object' &&
          platformSetting.poiInfo.hasOwnProperty('poiId') &&
          platformSetting.poiInfo.poiId !== ''
        ) {
          post_loc = {
            poi_id: platformSetting.poiInfo.poiId,
            poi_type: platformSetting.poiInfo.poiType,
            subname: platformSetting.poiInfo.poiAddress,
            name: platformSetting.poiInfo.poiName,
          };
        }
        // 整合请求参数
        const requestData = {
          common: {
            type: publishType === 'video' ? 'video' : 'normal',
            title: platformSetting['title'],
            note_id: '',
            desc: description,
            source: JSON.stringify({
              type: 'web',
              ids: '',
              extraInfo: JSON.stringify({
                subType: '',
                systemId: 'web',
              }),
            }),
            business_binds: JSON.stringify({
              version: 1,
              noteId: 0,
              bizType:
                platformSetting.hasOwnProperty('timingTime') &&
                platformSetting.timingTime > Date.now()
                  ? 13
                  : 0,
              noteOrderBind: {},
              notePostTiming: {
                postTime:
                  platformSetting.hasOwnProperty('timingTime') &&
                  platformSetting.timingTime > Date.now()
                    ? platformSetting.timingTime.toString()
                    : '',
              },
              noteCollectionBind: {
                id: '',
              },
            }),
            ats: ats,
            hash_tag: hashTag,
            post_loc: post_loc,
            privacy_info: {
              op_type: 1,
              type: platformSetting['privacy'] ? 1 : 0,
              user_ids: platformSetting['privacy'] ? [] : undefined,
            },
          },
          image_info: xhs_image_info,
          video_info: xhs_video_info,
        };
        console.log('platformSetting：', platformSetting);
        console.log('requestData：', requestData);
        // 获取加密使用的Url
        const encryptUrl = this.postCreateVideoUrl.replace(
          'https://edith.xiaohongshu.com',
          '',
        );
        // 逆向获取XsXt
        console.log('encryptUrl', encryptUrl, requestData, cookie_a1);
        const reverseRes: any = await this.getReverseResult({
          url: encryptUrl,
          data: requestData,
          a1: cookie_a1,
        });
        console.log('reverseRes', reverseRes);
        // 发起请求
        const createRes = await this.makeRequest(this.postCreateVideoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            Cookie: cookieString,
            Referer: this.loginUrl,
            Origin: this.loginUrl,
            'X-S': reverseRes['X-s'],
            'X-T': reverseRes['X-t'],
          },
          data: JSON.stringify(requestData),
          timeout: 15000,
        });

        console.log('createRes@@', createRes);
        // 处理结果
        if (createRes.hasOwnProperty('code') && createRes.code === -1) {
          reject('创建作品失败,失败原因:验签未通过');
          return;
        }
        if (createRes.hasOwnProperty('success') && !createRes.success) {
          reject('创建作品失败,失败原因:' + createRes.msg || '未知');
          return;
        }
        if (createRes.hasOwnProperty('result') && createRes.result !== 0) {
          reject('创建作品失败,失败原因:' + createRes.msg || '未知');
          return;
        }
        // 返回结果
        resolve({
          shareLink: createRes.share_link ?? '',
          publishId: createRes.data.id,
        });
      } catch (err: any) {
        let errorMessage;
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err) {
          errorMessage = err;
        } else {
          errorMessage = '未知';
        }
        reject('创建作品失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 视频作品发布
   * @param cookies
   * @param filePath
   * @param platformSetting
   * @param callback
   */
  async publishVideoWorkApi(
    cookies: string,
    filePath: string,
    platformSetting: {
      // 标题
      title?: string;
      // 描述
      desc?: string;
      // 定时发布
      timingTime?: number;
      // @用户
      mentionedUserInfo?: {
        nickName: string;
        uid: string;
      }[];
      // 话题
      topicsDetail?: {
        topicId: string;
        topicName: string;
      }[];
      // 位置
      poiInfo?: {
        poiType: number;
        poiId: string;
        poiName: string;
        poiAddress: string;
      };
      cover: string;
      // true=私有 flase=公开
      privacy: boolean;
    },
    callback: (progress: number, msg?: string) => void,
  ): Promise<{
    publishTime: number;
    publishId: string;
    shareLink: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        callback(5, '正在加载...');
        // 获取文件信息
        const fileInfo = await FileUtils.getFileInfo(filePath);
        // 初始化cookie
        callback(10);
        const cookieString = CommonUtils.convertCookieToJson(cookies);
        // 获取文件大小及分片信息
        callback(15);
        const filePartInfo = await FileUtils.getFilePartInfo(
          filePath,
          this.fileBlockSize,
        );

        callback(20, '正在上传视频...');
        // 上传视频,获取远程Url
        const { uploadFileId } = await this.uploadVideoFile(
          cookieString,
          filePath,
          filePartInfo,
          fileInfo,
        );

        callback(40, '正在上传封面...');
        // 上传封面,获取远程Url
        const { coverDimensions, coverUploadFileId } =
          await this.uploadCoverFile(cookieString, platformSetting['cover']);
        const cookieObject = JSON.parse(cookies);
        let cookie_a1 = null;
        for (const cookieItem of cookieObject) {
          if (cookieItem.name === 'a1') {
            cookie_a1 = cookieItem.value;
            break;
          }
        }

        // 创建作品
        const uploadResult = {
          uploadFileId: uploadFileId,
          uploadCoverId: coverUploadFileId,
          coverDimensions: coverDimensions,
          fileInfo: fileInfo,
        };
        callback(70, '正在发布...');
        const result: any = await this.postCreateVideo(
          cookieString,
          cookie_a1,
          'video',
          uploadResult,
          platformSetting,
        ).catch((err) => {
          reject(err);
        });
        callback(100);
        // 返回信息
        resolve({
          publishTime: Math.floor(Date.now() / 1000),
          publishId: result.publishId,
          shareLink: result.shareLink || '',
        });
      } catch (err) {
        reject(err);
        callback(-1);
      }
    });
  }

  /**
   * 获取X-Sign请求参数
   * @param requestUrl
   */
  getRequestXSign(requestUrl: any) {
    return new Promise((resolve, reject) => {
      try {
        const replaceUrl =
          requestUrl.replace('https://www.xiaohongshu.com', '') + 'WSUDD';
        const xSign =
          'X' + crypto.createHash('md5').update(replaceUrl).digest('hex');
        resolve(xSign);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 获取小红书Xs|Xt
   */
  getReverseResult(args: any) {
    return new Promise(async (resolve, reject) => {
      const permitRes = await this.makeRequest('http://116.62.154.231:7879', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        data: args,
        timeout: 15000,
      });
      resolve(permitRes);
    });
  }

  // 获取话题数据
  async getTopics({
    keyword,
    cookies,
  }: {
    keyword: string;
    cookies: Electron.Cookie[];
  }) {
    return await requestNet<IXHSTopicsResponse>({
      url: `https://edith.xiaohongshu.com/web_api/sns/v1/search/topic`,
      method: 'POST',
      headers: {
        cookie: CookieToString(cookies),
        Referer: this.loginUrl,
        origin: this.loginUrl,
      },
      body: {
        keyword: keyword,
        page: {
          page_size: 30,
          page: 1,
        },
      },
    });
  }

  // 获取位置数据
  async getLocations(params: {
    latitude: number;
    longitude: number;
    keyword: string;
    page?: number;
    size?: number;
    source?: string;
    type?: number;
    cookies: Electron.Cookie[];
  }) {
    return await requestNet<IXHSLocationResponse>({
      url: 'https://edith.xiaohongshu.com/web_api/sns/v1/local/poi/creator/search',
      headers: {
        cookie: CookieToString(params.cookies),
        Referer: this.loginUrl,
        origin: this.loginUrl,
      },
      method: 'POST',
      body: {
        ...params,
        page: 1,
        size: 50,
        source: 'WEB',
        type: 3,
      },
    });
  }

  // 获取@用户列表
  async getUsers(cookie: Electron.Cookie[], keyword: string, page: number) {
    return await requestNet<XiaohongshuApiResponse>({
      url: `https://edith.xiaohongshu.com/web_api/sns/v1/search/user_info`,
      headers: {
        cookie: CookieToString(cookie),
        Referer: this.loginUrl,
        origin: this.loginUrl,
      },
      method: 'POST',
      body: {
        keyword,
        search_id: '',
        page: {
          page_size: 10,
          page,
        },
      },
    });
  }
}

// 导出服务实例
export const xiaohongshuService = new XiaohongshuService();
