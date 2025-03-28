import { screen, BrowserWindow, net, session } from 'electron';
import { CommonUtils } from '../../util/common';
import path from 'path';
import { FileUtils } from '../../util/file';
import { CookieToString, getFileContent } from '../utils';
import requestNet from '../requestNet';
import {
  CommentInfo,
  SphGetCommentListResponse,
  SphGetPostListResponse,
  WeChatLocationData,
  WeChatVideoApiResponse,
  WeChatVideoUserData,
} from './wxShp.type';
import { v4 as uuidv4 } from 'uuid';
interface UserInfo {
  authorId: string;
  nickname: string;
  avatar: string;
  fansCount: number;
}

interface UploadArguments {
  apptype: any;
  filetype: any;
  weixinnum: any;
  filekey: string;
  filesize: any;
  taskid: string;
  scene: any;
  [key: string]: any;
}

export class ShipinhaoService {
  private defaultUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  private loginUrl = 'https://channels.weixin.qq.com';
  private getUserInfoUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data';
  private getDashboardUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/statistic/new_post_total_data';
  private getMixListUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/collection/get_collection_list?';
  private getSearchUserListUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_search_finder_account';
  private getPositionListUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_search_location';
  private getPublishTraceKeyUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/get-finder-post-trace-key';
  private getPublishUploadParamsUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_upload_params';
  private getApplyUploadDfsUrl =
    'https://finderassistancea.video.qq.com/applyuploaddfs';
  private uploadpartdfsUrl =
    'https://finderassistancea.video.qq.com/uploadpartdfs';
  private uploadCompleteUrl =
    'https://finderassistancea.video.qq.com/completepartuploaddfs';
  private postClipVideoUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_clip_video';
  private postClipVideoResultUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_clip_video_result';
  private postCreateVideoUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_create';
  private getUserWorkListUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_list';
  private checkFinderUrl =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/check_finder_comm_face';
  private fileBlockSize = 8388608;
  private windowName = 'shipinhao';
  private cookieCheckField = 'sessionid';
  private cookieIntervalList: { [key: string]: NodeJS.Timeout } = {};
  private windowMap: { [key: number]: BrowserWindow } = {}; // 添加窗口引用存储
  private callback?: (progress: number, msg?: string) => void;

  /**
   * 获取网站登录cookie
   */
  private async filterCookie(
    winContentsId: number,
    partition: string,
  ): Promise<Electron.Cookie[]> {
    return new Promise((resolve, reject) => {
      this.windowMap[winContentsId].webContents.on(
        'did-navigate',
        async (event, url) => {
          try {
            const cookies = await this.windowMap[
              winContentsId
            ].webContents.session.cookies.get({});
            const alreadyLogin = cookies.some(
              (item) =>
                item.name.includes(this.cookieCheckField) && item.value !== '',
            );
            // 如果获取到登录状态cookie
            if (alreadyLogin) {
              // 关闭定时器
              if (this.cookieIntervalList.hasOwnProperty(winContentsId)) {
                clearInterval(this.cookieIntervalList[winContentsId]);
                delete this.cookieIntervalList[winContentsId];
              }
              // 返回Cookie信息
              resolve(cookies);
            }
          } catch (error) {
            console.error(error);
            reject('获取网站cookie失败');
          }
        },
      );
    });
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(cookies: Electron.Cookie[]): Promise<UserInfo> {
    return new Promise(async (resolve, reject) => {
      const cookieString = CommonUtils.convertCookieToJson(cookies);
      try {
        const res = await this.makeRequest(this.getUserInfoUrl, {
          method: 'POST',
          headers: {
            Origin: 'https://channels.weixin.qq.com',
            Referer: 'https://channels.weixin.qq.com/platform',
            Cookie: cookieString,
          },
          timeout: 15000,
        });
        if (res.errCode === 0) {
          resolve({
            authorId: res.data.finderUser.uniqId ?? '',
            nickname: res.data.finderUser.nickname ?? '',
            avatar: res.data.finderUser.headImgUrl ?? '',
            fansCount: res.data.finderUser.fansCount ?? 0,
          });
        } else {
          reject(res.data?.errMsg ?? '未知错误');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * 获取账户信息
   * @param cookies Cookie信息
   * @param startDate 可选的开始日期，格式：YYYY-MM-DD
   * @param endDate 可选的结束日期，格式：YYYY-MM-DD
   */
  async getDashboardFunc(
    cookies: Electron.Cookie[],
    startDate?: string,
    endDate?: string,
  ): Promise<{
    success: boolean;
    data: Array<{
      date?: string;
      zhangfen: number;
      bofang: number;
      pinglun: number;
      dianzan: number;
      fenxiang: number;
      zhuye: number;
    }>;
    res: any;
  }> {
    return new Promise(async (resolve, reject) => {
      const cookieString = CommonUtils.convertCookieToJson(cookies);

      // 如果没有传入日期，使用默认的前天到昨天
      const endTs = endDate
        ? Math.floor(new Date(endDate).setHours(0, 0, 0, 0) / 1000).toString()
        : Math.floor(
            new Date(new Date().setDate(new Date().getDate() - 1)).setHours(
              0,
              0,
              0,
              0,
            ) / 1000,
          ).toString();

      const startTs = startDate
        ? Math.floor(new Date(startDate).setHours(0, 0, 0, 0) / 1000).toString()
        : Math.floor(
            new Date(new Date().setDate(new Date().getDate() - 2)).setHours(
              0,
              0,
              0,
              0,
            ) / 1000,
          ).toString();

      try {
        const res = await this.makeRequest(this.getDashboardUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://channels.weixin.qq.com',
            Referer: 'https://channels.weixin.qq.com/platform',
            Cookie: cookieString,
          },
          timeout: 15000,
          data: {
            endTs,
            interval: 3,
            startTs,
            timestamp: new Date().getTime(),
          },
        });
        // console.log('getDashboardFunc res:', JSON.stringify(res));
        if (res.errCode === 0) {
          if (endDate && startDate) {
            // 如果传入了日期范围，返回数组格式
            const dataArray = [];
            const dates = res.data.totalData.browse;
            const followData = res.data.totalData.follow;
            const browseData = res.data.totalData.browse;
            const commentData = res.data.totalData.comment;
            const likeData = res.data.totalData.like;
            const forwardData = res.data.totalData.forward;
            const snscoverData = res.data.totalData.snscover;

            for (let i = 0; i < dates.length; i++) {
              dataArray.push({
                date: dates[i],
                zhangfen: followData[i] || 0,
                bofang: browseData[i] || 0,
                pinglun: commentData[i] || 0,
                dianzan: likeData[i] || 0,
                fenxiang: forwardData[i] || 0,
                zhuye: snscoverData[i] || 0,
              });
            }

            resolve({
              success: true,
              data: dataArray,
              res,
            });
          } else {
            // 如果传入了日期范围，返回数组格式
            const dataArray = [];
            const indexs = res.data.totalData.browse.length - 1;
            const followData = res.data.totalData.follow;
            const browseData = res.data.totalData.browse;
            const commentData = res.data.totalData.comment;
            const likeData = res.data.totalData.like;
            const forwardData = res.data.totalData.forward;
            const snscoverData = res.data.totalData.snscover;

            dataArray.push({
              zhangfen: followData[indexs] || 0,
              bofang: browseData[indexs] || 0,
              pinglun: commentData[indexs] || 0,
              dianzan: likeData[indexs] || 0,
              fenxiang: forwardData[indexs] || 0,
              zhuye: snscoverData[indexs] || 0,
            });

            resolve({
              success: true,
              data: dataArray,
              res,
            });
          }
        } else {
          reject(res.data?.errMsg ?? '未知错误');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

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
    return new Promise(async (resolve, reject) => {
      try {
        // 如果是查看,则判断cookie是否过期
        const winRes = await this.createAuthorizationWindow(
          authModel === 'view' ? cookies : null,
        );
        const { winContentsId, partition } = winRes;
        // 获取登录态Cookie
        const newCookies = await this.filterCookie(winContentsId, partition);

        // 获取登录态用户信息
        const userInfo = await this.getUserInfo(newCookies);
        // 如果是授权,则需要关闭授权窗体
        if (authModel === 'login') {
          const win = this.windowMap[winContentsId];
          if (win && !win.isDestroyed()) {
            // 移除所有事件监听器
            win.webContents.removeAllListeners();
            // 关闭窗口
            win.destroy();
            // 清理引用
            delete this.windowMap[winContentsId];
          } else {
            console.log('Window not found or already destroyed');
          }
        }

        // 返回cookie
        resolve({
          success: true,
          data: {
            cookie: newCookies,
            userInfo: userInfo,
          },
        });
      } catch (e) {
        resolve({
          success: false,
          error: '获取失败',
        });
      }
    });
  }

  /**
   * 创建授权窗口
   */
  private async createAuthorizationWindow(cookies: any = null) {
    return new Promise<{ winContentsId: number; partition: string }>(
      async (resolve, reject) => {
        try {
          // 生成随机partition
          const partition = Date.now().toString();

          // 获取屏幕尺寸
          const { width, height } = screen.getPrimaryDisplay().workAreaSize;

          // 创建窗口
          const win = new BrowserWindow({
            width: Math.ceil(width * 0.8),
            height: Math.ceil(height * 0.8),
            show: false,
            icon: path.join(process.cwd(), 'public', 'images', 'logo-32.png'),
            webPreferences: {
              contextIsolation: false,
              nodeIntegration: false,
              partition: partition,
            },
          });
          win.show();

          const winContentsId = win.webContents.id;
          // 存储窗口引用
          this.windowMap[winContentsId] = win;

          // 如果是查看并且有cookie传入,如果有,判断登录态,如果登录态还在,则设置cookie
          if (cookies) {
            try {
              const loginStatus = await this.checkLoginStatus(cookies);
              if (loginStatus) {
                const cookiesObj =
                  typeof cookies === 'string' ? JSON.parse(cookies) : cookies;
                for (const cookie of cookiesObj) {
                  await session.fromPartition(partition).cookies.set({
                    url: this.loginUrl,
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                  });
                }
              }
            } catch (err) {
              console.error('Set cookies error:', err);
            }
          }

          // 设置用户代理
          win.webContents.setUserAgent(this.defaultUserAgent);

          // 监听导航错误
          win.webContents.on(
            'did-fail-load',
            (event, errorCode, errorDescription) => {
              console.error('Page failed to load:', errorDescription);
              // 不要立即 reject，给一些时间重试
              if (errorCode === -3) {
                // ERR_ABORTED 通常是因为重定向，不需要处理
                return;
              }
              reject(new Error(`Failed to load page: ${errorDescription}`));
            },
          );

          // 显示页面并设置置顶
          win.once('ready-to-show', () => {
            console.log('Window ready to show');
            win.focus();
            win.center();
            win.setAlwaysOnTop(true);
            win.setAlwaysOnTop(false);
          });

          // 监听窗口销毁
          win.webContents.on('destroyed', () => {
            console.log('Window destroyed:', winContentsId);
            if (this.cookieIntervalList.hasOwnProperty(winContentsId)) {
              clearInterval(this.cookieIntervalList[winContentsId]);
              delete this.cookieIntervalList[winContentsId];
            }
            // 清理窗口引用
            delete this.windowMap[winContentsId];
          });

          let isResolved = false;

          // 监听窗口加载完成
          win.webContents.on('did-finish-load', () => {
            if (!isResolved) {
              isResolved = true;
              resolve({ winContentsId, partition });
            }
          });

          // 加载登录页
          try {
            win.loadURL(this.loginUrl, {
              userAgent: this.defaultUserAgent,
              httpReferrer: 'https://channels.weixin.qq.com',
            });

            // 只有在页面没有触发 did-finish-load 的情况下才 resolve
            setTimeout(() => {
              if (!isResolved) {
                isResolved = true;
                resolve({ winContentsId, partition });
              }
            }, 5000); // 5秒后如果还没有 resolve，就强制 resolve
          } catch (err: any) {
            console.error('Load URL error:', err);
            // 如果是重定向错误，不需要 reject
            if (err.code !== -3 && !isResolved) {
              reject(err);
            }
          }
        } catch (err: any) {
          console.error('Create window error:', err);
          reject(err);
        }
      },
    );
  }

  /**
   * 检查用户登录是否过期
   */
  async checkLoginStatus(cookies: string): Promise<boolean> {
    const cookieString = CommonUtils.convertCookieToJson(cookies);
    try {
      const res = await this.makeRequest(this.getUserInfoUrl, {
        method: 'POST',
        headers: {
          Origin: 'https://channels.weixin.qq.com',
          Referer: 'https://channels.weixin.qq.com/platform',
          Cookie: cookieString,
        },
        timeout: 15000,
      });
      return res.errCode === 0;
    } catch (err) {
      console.log('-------- checkLoginStatus error ---', err);
      return false;
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
        request.write(
          typeof options.data === 'string'
            ? options.data
            : JSON.stringify(options.data),
        );
      }

      request.on('response', (response) => {
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
   * 上传文件到远程服务器
   * @param url 上传地址
   * @param fileContent 文件内容
   * @param headers 请求头
   * @param method HTTP 方法
   */
  private async uploadFile(
    url: string,
    fileContent: Buffer,
    headers: any,
    method: string = 'PUT',
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = net.request({
        method: method,
        url: url,
        headers: headers,
      });

      request.on('response', (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const result = data ? JSON.parse(data) : {};
            resolve(result);
          } catch (err) {
            console.error('解析响应数据失败:', err);
            resolve(response);
          }
        });
      });

      request.on('error', (error) => {
        console.error('请求出错:', error);
        reject(error);
      });

      // 写入请求体
      try {
        request.write(fileContent);
        request.end();
      } catch (err) {
        console.error('写入请求体时出错:', err);
        reject(err);
      }
    });
  }

  /**
   * 获取唯一任务uuid
   */
  private getUniqueTaskId(): string {
    return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  /**
   * 获取发布TraceKey
   * @param cookieString
   */
  private async getPublishTraceKey(cookieString: string): Promise<string> {
    const requestParams = {
      objectId: '',
      pluginSessionId: null,
      rawKeyBuff: null,
      reqScene: 7,
      scene: 7,
    };

    const res = await this.makeRequest(this.getPublishTraceKeyUrl, {
      method: 'POST',
      headers: {
        Cookie: cookieString,
      },
      body: requestParams,
    });

    if (res.errCode === 0) {
      return res.data.traceKey;
    } else {
      throw new Error('获取TraceKey失败,失败原因:' + (res.errMsg ?? '未知'));
    }
  }

  /**
   * 获取发布上传参数
   * @param cookieString
   */
  private async getPublishUploadParams(cookieString: string): Promise<any> {
    const requestParams = {
      reqScene: 7,
      scene: 7,
    };

    const res = await this.makeRequest(this.getPublishUploadParamsUrl, {
      method: 'POST',
      headers: {
        Cookie: cookieString,
      },
      body: requestParams,
    });

    if (res.errCode === 0) {
      return res.data;
    } else {
      throw new Error('获取上传参数失败,失败原因:' + (res.errMsg ?? '未知'));
    }
  }

  /**
   * 上传视频文件
   * @param filePath
   * @param uploadParams
   * @param filePartInfo
   */
  private async uploadVideoFile(
    filePath: string,
    uploadParams: any,
    filePartInfo: any,
  ): Promise<string> {
    try {
      // 拼接请求参数
      const uploadArguments: UploadArguments = {
        apptype: uploadParams.appType,
        filetype: uploadParams.videoFileType,
        weixinnum: uploadParams.uin,
        filekey: filePath.split(path.sep).slice(-1)[0],
        filesize: filePartInfo.fileSize,
        taskid: this.getUniqueTaskId(),
        scene: uploadParams.scene,
      };

      let uploadArgumentsString = '';
      for (const key in uploadArguments) {
        uploadArgumentsString += `${key}=${uploadArguments[key]}&`;
      }

      // 获取上传id - 使用 uploadFile 方法
      const requestBody = {
        BlockPartLength: filePartInfo.blockInfo,
        BlockSum: filePartInfo.blockInfo.length,
      };

      const uploadIdRes = await this.uploadFile(
        this.getApplyUploadDfsUrl,
        Buffer.from(JSON.stringify(requestBody)),
        {
          Authorization: uploadParams.authKey,
          'Content-Type': 'application/json',
          'X-Arguments': uploadArgumentsString,
        },
      );

      if (!uploadIdRes.UploadID) {
        throw new Error('上传视频失败,失败原因:获取上传id失败');
      }

      const uploadId = uploadIdRes.UploadID;
      const uploadPartInfo = [];

      // 分片上传文件
      for (let i = 0; i < filePartInfo.blockInfo.length; i++) {
        if (this.callback)
          this.callback(
            50,
            `上传视频（${i}/${filePartInfo.blockInfo.length}）`,
          );
        console.log(
          `开始上传第 ${i + 1}/${filePartInfo.blockInfo.length} 个分片`,
        );
        const chunkStart = i === 0 ? 0 : filePartInfo.blockInfo[i - 1];
        const chunkEnd = filePartInfo.blockInfo[i] - 1;
        const chunkContent = await FileUtils.getFilePartContent(
          filePath,
          chunkStart,
          chunkEnd,
        );

        // 开始上传
        const uploadUrl = `${this.uploadpartdfsUrl}?UploadID=${uploadId}&PartNumber=${i + 1}&QuickUpload=2`;
        const uploadPartRes = await this.uploadFile(uploadUrl, chunkContent, {
          Authorization: uploadParams.authKey,
          'X-Arguments': uploadArgumentsString,
          'Content-Type': 'application/octet-stream',
        });

        if (!uploadPartRes?.ETag) {
          throw new Error(
            '上传视频失败,失败原因3:' + uploadPartRes.data?.['X-Errno'] ||
              '未知错误',
          );
        }

        // 上传成功
        uploadPartInfo.push({
          PartNumber: i + 1,
          ETag: uploadPartRes.ETag,
        });
        console.log(`第 ${i + 1} 个分片上传成功`);
      }

      const completeBody = {
        TransFlag: '0_0',
        PartInfo: uploadPartInfo,
      };

      const uploadCompleteRes = await this.uploadFile(
        this.uploadCompleteUrl + `?UploadID=${uploadId}`,
        Buffer.from(JSON.stringify(completeBody)),
        {
          Authorization: uploadParams.authKey,
          'Content-Type': 'application/json',
          'X-Arguments': uploadArgumentsString,
        },
      );

      if (!uploadCompleteRes.DownloadURL) {
        throw new Error('上传视频失败,失败原因2:合并分片失败');
      }

      return uploadCompleteRes.DownloadURL.replace(
        'http://wxapp.tc.qq.com',
        'https://finder.video.qq.com',
      );
    } catch (err: any) {
      const errorMessage = err?.message || err || '未知';
      throw new Error('上传视频失败,失败原因1:' + errorMessage);
    }
  }

  /**
   * 上传封面文件
   * @param filePath
   * @param uploadParams
   */
  private async uploadCoverFile(
    filePath: string,
    uploadParams: any,
  ): Promise<string> {
    try {
      const fileRes = await getFileContent(filePath);

      // 图片数据
      const fileData = fileRes;

      // 拼接请求参数
      const uploadArguments: UploadArguments = {
        apptype: uploadParams.appType,
        filetype: uploadParams.pictureFileType,
        weixinnum: uploadParams.uin,
        filekey: 'finder_video_img.jpeg',
        filesize: fileData.length,
        taskid: this.getUniqueTaskId(),
        scene: uploadParams.scene,
      };

      let uploadArgumentsString = '';
      for (const key in uploadArguments) {
        uploadArgumentsString += `${key}=${uploadArguments[key]}&`;
      }

      // 获取上传id
      const uploadIdRes = await this.uploadFile(
        this.getApplyUploadDfsUrl,
        Buffer.from(
          JSON.stringify({
            BlockPartLength: [fileData.length],
            BlockSum: 1,
          }),
        ),
        {
          Authorization: uploadParams.authKey,
          'Content-Type': 'application/json',
          'X-Arguments': uploadArgumentsString,
        },
      );

      if (!uploadIdRes.UploadID) {
        throw new Error('上传封面失败,失败原因:获取上传id失败');
      }

      const uploadId = uploadIdRes.UploadID;

      // 开始上传
      const uploadPartRes = await this.uploadFile(
        this.uploadpartdfsUrl +
          `?UploadID=${uploadId}&PartNumber=1&QuickUpload=2`,
        fileData,
        {
          Authorization: uploadParams.authKey,
          'X-Arguments': uploadArgumentsString,
          'Content-Type': 'application/octet-stream',
        },
      );

      if (!uploadPartRes.ETag) {
        throw new Error(
          '上传封面失败,失败原因:' + uploadPartRes.data?.['X-Errno'] ||
            '未知错误',
        );
      }

      // 上传成功
      const uploadPartInfo = [
        {
          PartNumber: 1,
          ETag: uploadPartRes.ETag,
        },
      ];

      // 完成分片上传
      const uploadCompleteRes = await this.uploadFile(
        this.uploadCompleteUrl + `?UploadID=${uploadId}`,
        Buffer.from(
          JSON.stringify({
            TransFlag: '0_0',
            PartInfo: uploadPartInfo,
          }),
        ),
        {
          Authorization: uploadParams.authKey,
          'Content-Type': 'application/json',
          'X-Arguments': uploadArgumentsString,
        },
      );

      if (!uploadCompleteRes.DownloadURL) {
        throw new Error('上传封面失败,失败原因:合并分片失败');
      }

      return uploadCompleteRes.DownloadURL;
    } catch (err: any) {
      const errorMessage = err?.message || err || '未知';
      throw new Error('上传封面失败,失败原因:' + errorMessage);
    }
  }

  /**
   * 提交官方剪辑任务
   */
  private async postClipUploadVideo(
    traceKey: string,
    startUploadTime: number,
    endUploadTime: number,
    remoteFileUrl: string,
    fileInfo: any,
    filePartInfo: any,
    cookieString: string,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let videoInfos = null;
        for (const info of fileInfo.streams) {
          if (
            info.hasOwnProperty('codec_type') &&
            info.codec_type === 'video'
          ) {
            videoInfos = info;
            break;
          }
        }
        if (!videoInfos) {
          reject('----- postClipUploadVideo ---- jianji');
          return;
        }
        if (videoInfos.duration < 3) {
          reject('提交剪辑失败,失败原因:视频时长不能小于3秒!');
          return;
        }
        const postClipVideoRes = await this.makeRequest(this.postClipVideoUrl, {
          method: 'POST',
          headers: {
            Cookie: cookieString,
            'Content-Type': 'application/json',
          },
          data: {
            clipOriginVideoInfo: {
              width: videoInfos.width,
              height: videoInfos.height,
              fileSize: fileInfo.format.size ?? 0,
              duration: videoInfos.duration,
            },
            cropDuration: 0,
            width: videoInfos.width,
            height: videoInfos.height,
            pluginSessionId: null,
            rawKeyBuff: null,
            reqScene: 7,
            scene: 7,
            targetWidth: videoInfos.height,
            targetHeight: videoInfos.width,
            timeStart: 0,
            timestamp: Date.now(),
            traceInfo: {
              traceKey: traceKey,
              uploadCdnStart: startUploadTime,
              uploadCdnEnd: endUploadTime,
            },
            type: 4,
            url: remoteFileUrl,
            useAstraThumbCover: 0,
            x: 0,
            y: 0,
          },
          dataType: 'json',
          timeout: 15000,
        });
        if (postClipVideoRes.errCode !== 0) {
          reject('提交剪辑失败,失败原因:' + postClipVideoRes.errMsg);
          return;
        }
        const { clipKey } = postClipVideoRes.data;
        resolve({
          clipKey: clipKey,
          url: remoteFileUrl,
          fileSize: filePartInfo.fileSize,
          duration: Math.ceil(videoInfos.duration),
          width: videoInfos.width,
          height: videoInfos.height,
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
        reject('提交剪辑任务失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 创建视频
   */
  private async postCreateVideo(
    cookieString: string,
    traceKey: string,
    startUploadTime: number,
    endUploadTime: number,
    clipResult: any,
    platformSetting: any,
  ): Promise<{
    lastPublishId: string;
    previewVideoLink: string;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理标题、@好友、话题
        let description = platformSetting['title'] ?? '';
        const topics = [];
        const mentionedUser = [];
        if (
          platformSetting.hasOwnProperty('topics') &&
          platformSetting.topics?.length > 0
        ) {
          for (const topic of platformSetting.topics) {
            description += ` #${topic}`;
            topics.push(topic);
          }
        }
        if (
          platformSetting.hasOwnProperty('mentionedUserInfo') &&
          platformSetting.mentionedUserInfo?.length > 0
        ) {
          for (const userInfo of platformSetting.mentionedUserInfo) {
            if (
              userInfo.hasOwnProperty('nickName') &&
              userInfo.nickName !== ''
            ) {
              description += ` @${userInfo.nickName}`;
              mentionedUser.push({
                nickname: userInfo.nickName,
              });
            }
          }
        }
        // 处理合集
        let topicMix = {};
        if (
          platformSetting.hasOwnProperty('mixInfo') &&
          typeof platformSetting.mixInfo === 'object' &&
          platformSetting.mixInfo.hasOwnProperty('mixId') &&
          platformSetting.mixInfo.hasOwnProperty('mixName')
        ) {
          topicMix = {
            collectionId: platformSetting.mixInfo['mixId'],
            collectionName: platformSetting.mixInfo['mixName'],
          };
        }
        // 处理POI
        let poiInfo = {};
        if (
          platformSetting.hasOwnProperty('poiInfo') &&
          typeof platformSetting.poiInfo === 'object' &&
          platformSetting.poiInfo.hasOwnProperty('poiId') &&
          platformSetting.poiInfo.poiId !== ''
        ) {
          poiInfo = {
            latitude: platformSetting.poiInfo.latitude,
            longitude: platformSetting.poiInfo.longitude,
            city: platformSetting.poiInfo.poiCity,
            poiName: platformSetting.poiInfo.poiName,
            address: platformSetting.poiInfo.poiAddress,
            poiClassifyId: platformSetting.poiInfo.poiId,
          };
        }
        // 整合请求参数
        const requestData = {
          objectType: 0,
          longitude: 0,
          latitude: 0,
          feedLongitude: 0,
          feedLatitude: 0,
          originalFlag: 0,
          topics: topics,
          isFullPost: 1,
          handleFlag: 2,
          videoClipTaskId: clipResult['clipKey'],
          traceInfo: {
            traceKey: traceKey,
            uploadCdnStart: startUploadTime,
            uploadCdnEnd: endUploadTime,
          },
          objectDesc: {
            mpTitle: '',
            description: description,
            extReading: {},
            mediaType: 4,
            location: poiInfo,
            topic: topicMix,
            event: platformSetting['event'] || {},
            mentionedUser: mentionedUser,
            media: [
              {
                url: clipResult['url'],
                fileSize: clipResult['fileSize'],
                thumbUrl: platformSetting['cover'],
                fullThumbUrl: platformSetting['cover'],
                mediaType: 4,
                videoPlayLen: clipResult['duration'],
                width: clipResult['width'],
                height: clipResult['height'],
                md5sum: this.getUniqueTaskId(),
                coverUrl: platformSetting['cover'],
                fullCoverUrl: platformSetting['cover'],
                urlCdnTaskId: clipResult['clipKey'],
              },
            ],
            member: {},
          },
          postFlag: 0,
          mode: 1,
          clientid: this.getUniqueTaskId(),
          timestamp: Date.now(),
          rawKeyBuff: null,
          pluginSessionId: null,
          scene: 7,
          reqScene: 7,
        };
        // 处理定时时间
        if (
          platformSetting.hasOwnProperty('timingTime') &&
          platformSetting.timingTime > Date.now()
        ) {
          (requestData as any).effectiveTime = Math.floor(
            platformSetting.timingTime / 1000,
          );
        }
        console.log('requestData：', requestData);
        // 发起请求
        const createRes = await this.makeRequest(this.postCreateVideoUrl, {
          method: 'POST',
          headers: {
            Cookie: cookieString,
            'Content-Type': 'application/json',
          },
          data: JSON.stringify(requestData),
          dataType: 'json',
          timeout: 15000,
        });
        if (createRes.errCode !== 0) {
          reject('发布失败,失败原因:' + createRes.errMsg);
          return;
        }
        if (
          !createRes.data.hasOwnProperty('baseResp') ||
          createRes.data.baseResp.errcode !== 0
        ) {
          reject('发布失败,失败原因:' + createRes.data.baseResp.errmsg);
        } else {
          const lastWorkInfo = await this.getLastPublishId(cookieString);
          resolve(lastWorkInfo);
        }
      } catch (err: any) {
        let errorMessage;
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err) {
          errorMessage = err;
        } else {
          errorMessage = '未知';
        }
        reject('发布失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 获取用户视频列表最后一条发布的视频Id
   */
  private async getLastPublishId(cookieString: string): Promise<{
    lastPublishId: string;
    previewVideoLink: string;
  }> {
    const workListRes = await this.makeRequest(this.getUserWorkListUrl, {
      method: 'POST',
      headers: {
        Cookie: cookieString,
        'Content-Type': 'application/json',
      },
      data: {
        pageSize: 20,
        currentPage: 1,
        rawKeyBuff: null,
        pluginSessionId: null,
        scene: 7,
        reqScene: 7,
      },
    });

    let work;
    if (workListRes.errCode === 0) {
      const workList = workListRes.data.list;
      if (workList.length > 0) {
        work = workList[0];
      }
    }

    // 获取预览的视频链接
    const previewVideoRes = await this.makeRequest(
      'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/get_object_short_link',
      {
        method: 'POST',
        headers: {
          Cookie: cookieString,
          'Content-Type': 'application/json',
        },
        data: {
          exportId: work.exportId,
          nonceId: work.objectNonce,
        },
      },
    );

    return {
      lastPublishId: work?.desc?.media[0]?.md5sum ?? '',
      previewVideoLink: previewVideoRes,
    };
  }

  /**
   * 视频作品发布
   */
  async publishVideoWorkApi(
    cookies: Electron.Cookie[],
    filePath: string,
    platformSetting: {
      cover: string;
      title?: string;
      topics?: string[];
      des?: string;
      timingTime?: number;
      // 位置信息
      poiInfo?: {
        latitude: number;
        longitude: number;
        poiCity: string;
        poiName: string;
        poiAddress: string;
        poiId: string;
      };
      // @的用户
      mentionedUserInfo?: {
        nickName?: string;
      }[];
      // 活动
      event?: {
        eventCreatorNickname: string;
        eventTopicId: string;
        eventName: string;
      };
    },
    callback: (progress: number, msg?: string) => void,
  ): Promise<{
    publishTime: number;
    publishId: string;
    shareLink: string;
  }> {
    this.callback = callback;
    console.log('platformSetting：', platformSetting);
    callback(5, '加载中...');
    const fileInfo = await FileUtils.getFileInfo(filePath);
    callback(10);
    const cookieString = CommonUtils.convertCookieToJson(cookies);
    callback(15);
    const traceKey = await this.getPublishTraceKey(cookieString);
    callback(20);
    const uploadParams = await this.getPublishUploadParams(cookieString);
    callback(26);
    const filePartInfo = await FileUtils.getFilePartInfo(
      filePath,
      this.fileBlockSize,
    );
    const startUploadTime = Math.floor(Date.now() / 1000);
    const remoteVideoUrl = await this.uploadVideoFile(
      filePath,
      uploadParams,
      filePartInfo,
    );
    callback(30);
    const endUploadTime = Math.floor(Date.now() / 1000);

    callback(40, '正在上传视频...');
    const clipResult = await this.postClipUploadVideo(
      traceKey,
      startUploadTime,
      endUploadTime,
      remoteVideoUrl,
      fileInfo,
      filePartInfo,
      cookieString,
    );
    callback(60, '正在上传封面...');
    platformSetting.cover = await this.uploadCoverFile(
      platformSetting.cover,
      uploadParams,
    );
    callback(80, '正在发布视频...');
    const lastPublishRes = await this.postCreateVideo(
      cookieString,
      traceKey,
      startUploadTime,
      endUploadTime,
      clipResult,
      {
        ...platformSetting,
        cover: platformSetting.cover,
        title: platformSetting.title,
        topics: platformSetting.topics ? platformSetting.topics : [],
      },
    );
    callback(100);

    // 返回成功
    return {
      publishTime: Math.floor(Date.now() / 1000),
      publishId: lastPublishRes.lastPublishId,
      shareLink: lastPublishRes.previewVideoLink,
    };
  }

  // 获取位置数据
  async getLocation(params: {
    query: string;
    longitude: number;
    latitude: number;
    cookie: Electron.Cookie[];
  }) {
    return await requestNet<WeChatLocationData>({
      url: `https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_search_location`,
      method: 'POST',
      body: {
        ...params,
        reqScene: 7,
        scene: 7,
      },
      headers: {
        cookie: CookieToString(params.cookie),
      },
    });
  }

  // 获取视频号的活动
  async getActivityList(params: { cookie: Electron.Cookie[]; query: string }) {
    return await requestNet<WeChatVideoApiResponse>({
      url: `https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_search_event`,
      method: 'POST',
      body: params,
      headers: {
        cookie: CookieToString(params.cookie),
      },
    });
  }

  // 获取@用户列表
  async getUsers(cookie: Electron.Cookie[], keyword: string, page: number) {
    return await requestNet<WeChatVideoUserData>({
      url: `https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_search_finder_account`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'POST',
      body: {
        pageSize: 10,
        currentPage: page,
        offset: (page - 1) * 10,
        query: keyword,
      },
    });
  }

  /**
   * 获取作品列表
   * @returns
   */
  async getPostList(
    cookie: Electron.Cookie[],
    pageInfo: { pageNo: number; pageSize: number },
  ) {
    const res = await requestNet<SphGetPostListResponse>({
      url: `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/post/post_list?_rid=67d03155-a6da7281`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'POST',
      body: {
        currentPage: pageInfo.pageNo,
        forMcn: false,
        needAllCommentCount: true,
        onlyUnread: false,
        pageSize: pageInfo.pageSize,
        pluginSessionId: null,
        rawKeyBuff: null,
        reqScene: 7, // 固定值
        scene: 7, // 固定值
        timestamp: Date.now() + '', // '1741697365389',
        userpageType: 13,
        _log_finder_id:
          'v2_060000231003b20faec8c5e38b10cbd6cb06ef3cb077ad5b14a8587570bc414e95c4b7e034ea@finder',
        _log_finder_uin: '',
      },
    });

    const ret = res.data.data;
    return ret;
  }

  /**
   * 获取评论列表
   * @param cookie
   * @param exportId
   * @returns
   */
  async getCommentList(cookie: Electron.Cookie[], exportId: string) {
    const res = await requestNet<SphGetCommentListResponse>({
      url: `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/comment_list?_rid=67d032a7-6c8f7126`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'POST',
      body: {
        commentSelection: false,
        exportId,
        forMcn: false,
        lastBuff: '',
        pluginSessionId: null,
        rawKeyBuff: null,
        reqScene: 7,
        scene: 7,
        timestamp: Date.now() + '',
        _log_finder_id:
          'v2_060000231003b20faec8c5e38b10cbd6cb06ef3cb077ad5b14a8587570bc414e95c4b7e034ea@finder',
        _log_finder_uin: '',
      },
    });

    const ret = res.data.data;
    return ret;
  }

  /**
   * 评论作品和回复评论
   * @param cookie
   * @param exportId
   * @param content
   * @param comment
   * @returns
   */
  async createComment(
    cookie: Electron.Cookie[],
    exportId: string,
    content: string,
    comment: Partial<CommentInfo> = {},
  ) {
    const res = await requestNet<WeChatVideoUserData>({
      url: `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/create_comment?_rid=67d032a7-6c8f7126`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'POST',
      body: {
        clientId: uuidv4(),
        comment, // 默认{}
        content,
        exportId,
        pluginSessionId: null,
        rawKeyBuff: null,
        replyCommentId: comment?.commentId || '',
        reqScene: 7,
        rootCommentId: comment?.replyCommentId || '',
        scene: 7,
        timestamp: Date.now() + '',
        _log_finder_id:
          'v2_060000231003b20faec8c5e38b10cbd6cb06ef3cb077ad5b14a8587570bc414e95c4b7e034ea@finder',
        _log_finder_uin: '',
      },
    });

    console.log('------- WxSph createComment ----', res);

    return res;
  }
}

// 导出服务实例
export const shipinhaoService = new ShipinhaoService();
