import { BrowserWindow, net, screen, session } from 'electron';
import { CommonUtils } from '../../util/common';
import path from 'path';
import { FileUtils } from '../../util/file';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import crc32 from 'crc32';
import { CookieToString, getFileContent } from '../utils';
import {
  DouyinActivityDetailResponse,
  DouyinActivityListResponse,
  DouyinActivityTagsResponse,
  DouyinAllHotDataResponse,
  DouyinCreatorCommentListResponse,
  DouyinCreatorListResponse,
  DouyinHotDataResponse,
  DouyinLocationDataResponse,
  DouyinNewCommentResponse,
  DouyinTopicsSugResponse,
  DouyinUserListResponse,
} from './douyin.type';
import requestNet from '../requestNet';
import { jsonToQueryString } from '../../util';
import { DeclarationDouyin } from './common.douyin';

type PlatformSettingType = {
  // 自主声明
  userDeclare?: DeclarationDouyin;
  // 合集
  mixInfo?: {
    mixId: string;
    mixName: string;
  };
  // 关联热点，传热点中文名称即可
  hot_sentence?: string;
  // 活动
  activity?: {
    value: string;
    label: string;
  }[];
  // @用户
  mentionedUserInfo?: {
    nickName: string;
    uid: string;
  }[];
  // 标题
  title: string;
  // 描述
  caption?: string;
  topics?: string[];
  cover: string;
  timingTime?: number;
  // 0 公共 1 私密 2 好友
  visibility_type: 0 | 1 | 2;
  // 地址
  poiInfo?: {
    poiId: string;
    poiName: string;
  };
  // 背景音乐
  musicId?: string;
};

export class DouyinService {
  private defaultUserAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
  private loginUrl = 'https://creator.douyin.com/';
  private getUserInfoUrl =
    'https://creator.douyin.com/web/api/media/user/info/';
  private getDashboardUrl =
    'https://creator.douyin.com/janus/douyin/creator/data/overview/dashboard';
  private getMixListUrl = 'https://creator.douyin.com/web/api/mix/list/';
  private getSearchUserListUrl =
    'https://creator.douyin.com/web/api/v2/discover/search/';
  private getUploadAuthUrl =
    'https://creator.douyin.com/web/api/media/upload/auth/v5/';
  private getUploadVideoProofUrl = 'https://vod.bytedanceapi.com/';
  private getCsrfTokenUrl =
    'https://creator.douyin.com/web/api/media/anchor/search';
  private publishUrl = 'https://creator.douyin.com/web/api/media/aweme/create/';
  private publishUrlV2 =
    'https://creator.douyin.com/web/api/media/aweme/create_v2/';
  private getUploadImageProofUrl = 'https://imagex.bytedanceapi.com/';
  private windowName = 'douyin';
  private cookieCheckField = 'sessionid';
  private cookieSecscdUidCheckField = 'x-web-secsdk-uid';
  private cookieIntervalList: { [key: string]: NodeJS.Timeout } = {};
  private windowMap: { [key: number]: BrowserWindow } = {};
  private fileBlockSize = 3145728;
  private app: any;

  /**
   * 授权|预览
   */
  async loginOrView(
    authModel: 'login' | 'view',
    cookies?: any,
  ): Promise<{
    success: boolean;
    data?: { cookie: string; userInfo: any; localStorage: string };
    error?: string;
  }> {
    return new Promise((resolve, reject) => {
      this.createAuthorizationWindow(
        authModel === 'view' ? cookies : null,
      ).then(async (winRes) => {
        const { winContentsId, partition } = winRes;
        try {
          // 获取登录态Cookie
          const cookies = await this.filterCookie(winContentsId, partition);
          // 获取私钥及web_protect
          const localStorage = await this.filterLocalStorage(winContentsId);
          // 获取登录态用户信息
          const userInfo = await this.getUserInfo(cookies);
          // 返回cookie

          resolve({
            success: true,
            data: {
              cookie: JSON.stringify(cookies),
              userInfo: userInfo,
              localStorage: localStorage,
            },
          });
        } catch (e) {
          reject(e);
        } finally {
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
              console.log('Window closed successfully');
            } else {
              console.log('Window not found or already destroyed');
            }

            // const winBrowserWindow = BrowserWindow.fromId(winContentsId);
            // winBrowserWindow?.close();
          }
        }
      });
    });
  }

  /**
   * 检查用户登录是否过期
   */
  async checkLoginStatus(cookies: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const cookieString = CommonUtils.convertCookieToJson(cookies);
      try {
        const res = await this.makeRequest(this.getUserInfoUrl, {
          method: 'GET',
          headers: {
            Cookie: cookieString,
          },
          timeout: 15000,
        });

        if (res.status_code !== 0) {
          reject(res.status_msg ?? '未知错误');
          return;
        }
        resolve(true);
      } catch (err) {
        console.error('检查登录状态失败:', err);
        reject(err);
      }
    });
  }

  /**
   * 数据表现
   */
  async getDashboardFunc(
    cookies: string,
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
    res?: any;
  }> {
    return new Promise(async (resolve, reject) => {
      const cookieString = CommonUtils.convertCookieToJson(cookies);
      try {
        const res = await this.makeRequest(this.getDashboardUrl, {
          method: 'POST',
          headers: {
            Cookie: cookieString,
          },
          data: JSON.stringify({
            recent_days: startDate && endDate ? 30 : 1,
          }),
          timeout: 15000,
        });

        if (res.status_code !== 0) {
          reject(res.status_msg ?? '未知错误');
          return;
        }

        if (startDate && endDate) {
          // 处理30天的数据
          const dataMap: { [key: string]: any } = {};

          // 转换日期格式为比较格式
          const startDateStr = startDate.replace(/-/g, '');
          const endDateStr = endDate.replace(/-/g, '');

          // 遍历所有指标
          for (const metric of res.metrics) {
            if (metric.trends) {
              metric.trends.forEach((trend: any) => {
                const dateStr = trend.date_time;
                // 判断日期是否在范围内
                if (dateStr >= startDateStr && dateStr <= endDateStr) {
                  if (!dataMap[dateStr]) {
                    dataMap[dateStr] = {
                      date: `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`,
                      zhangfen: 0,
                      bofang: 0,
                      pinglun: 0,
                      dianzan: 0,
                      fenxiang: 0,
                      zhuye: 0,
                    };
                  }

                  // 根据指标名称设置对应的值
                  switch (metric.english_metric_name) {
                    case 'net_fans_cnt':
                      dataMap[dateStr].zhangfen = trend.value;
                      break;
                    case 'play_cnt':
                      dataMap[dateStr].bofang = trend.value;
                      break;
                    case 'comment_cnt':
                      dataMap[dateStr].pinglun = trend.value;
                      break;
                    case 'digg_cnt':
                      dataMap[dateStr].dianzan = trend.value;
                      break;
                    case 'share_count':
                      dataMap[dateStr].fenxiang = trend.value;
                      break;
                    case 'homepage_view_cnt':
                      dataMap[dateStr].zhuye = trend.value;
                      break;
                  }
                }
              });
            }
          }

          // 转换为数组并按日期排序
          const dataArray = Object.values(dataMap).sort((a, b) =>
            b.date.localeCompare(a.date),
          );

          resolve({
            success: true,
            data: dataArray,
          });
        } else {
          // 保持原有的单日数据处理逻辑
          const data = {
            zhangfen: 0,
            bofang: 0,
            pinglun: 0,
            dianzan: 0,
            fenxiang: 0,
            zhuye: 0,
          };

          for (let index = 0; index < res.metrics.length; index++) {
            const element = res.metrics[index];

            if (element.english_metric_name === 'net_fans_cnt') {
              data.zhangfen = element.metric_value;
            }

            if (element.english_metric_name === 'play_cnt') {
              data.bofang = element.metric_value;
            }

            if (element.english_metric_name === 'comment_cnt') {
              data.pinglun = element.metric_value;
            }

            if (element.english_metric_name === 'digg_cnt') {
              data.dianzan = element.metric_value;
            }

            if (element.english_metric_name === 'share_count') {
              data.fenxiang = element.metric_value;
            }

            if (element.english_metric_name === 'homepage_view_cnt') {
              data.zhuye = element.metric_value;
            }
          }

          resolve({
            success: true,
            data: [data],
          });
        }
      } catch (err) {
        console.error('检查登录状态失败:', err);
        reject(err);
      }
    });
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(cookies: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const cookieString = CommonUtils.convertCookieToJson(cookies);
      try {
        const res = await this.makeRequest(this.getUserInfoUrl, {
          method: 'GET',
          headers: {
            Cookie: cookieString,
          },
          timeout: 15000,
        });

        if (res.status_code === 0) {
          resolve({
            uid: res.user.sec_uid,
            authorId:
              res.user.unique_id !== '' ? res.user.unique_id : res.user.uid,
            nickname: res.user.nickname ?? '',
            avatar: res.user.avatar_thumb.url_list[0] ?? '',
            fansCount: res.user.follower_count ?? 0,
          });
        } else {
          reject(res.status_msg ?? '未知错误');
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
        reject(err);
      }
    });
  }

  /**
   * 上传封面文件
   */
  private async uploadCoverFile(
    filePath: string,
    cookieString: string,
    userUid: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('开始上传封面文件:', filePath);

        // 获取上传令牌所需Ak和Tk
        const uploadAuth = await this.getUploadAuth(cookieString);
        console.log('获取到的上传令牌:', uploadAuth);

        // 获取图片数据
        const imageRes = await getFileContent(filePath);
        console.log('获取到的图片数据大小:', imageRes.length);

        // 获取图片Crc32标识
        const imageCrc32 = crc32(imageRes).toString(16);
        console.log('图片Crc32标识:', imageCrc32);

        // 获取图片上传凭证签名所需参数
        const getUploadImageProofRequestParams = {
          Action: 'ApplyImageUpload',
          ServiceId: 'jm8ajry58r',
          Version: '2018-08-01',
          app_id: 2906,
          s: this.generateRandomString(11),
          user_id: userUid,
        };

        // 获取图片上传请求头
        const requestHeadersInfo = await this.generateAuthorizationAndHeader(
          uploadAuth.AccessKeyID,
          uploadAuth.SecretAccessKey,
          uploadAuth.SessionToken,
          'cn-north-1',
          'imagex',
          'GET',
          getUploadImageProofRequestParams,
        );
        console.log('requestHeadersInfo:', requestHeadersInfo);

        // 获取图片上传凭证
        const uploadImgRes = await this.makeRequest(
          this.getUploadImageProofUrl +
            '?' +
            this.httpBuildQuery(getUploadImageProofRequestParams),
          {
            method: 'GET',
            headers: requestHeadersInfo,
            timeout: 15000,
          },
        );

        console.log('uploadImgRes:', uploadImgRes);

        if (uploadImgRes['ResponseMetadata'].hasOwnProperty('Error')) {
          reject(uploadImgRes['ResponseMetadata']['Error']['Message']);
          return;
        }

        const UploadAddress = uploadImgRes.Result.UploadAddress;
        // 用凭证拼接上传图片接口
        const uploadImgUrl = `https://${UploadAddress.UploadHosts[0]}/upload/v1/${UploadAddress.StoreInfos[0].StoreUri}`;

        // 上传图片
        const imageUploadRes = await this.uploadFile(
          uploadImgUrl,
          imageRes,
          {
            Authorization: UploadAddress.StoreInfos[0].Auth,
            'Content-Crc32': imageCrc32,
            'Content-Type': 'application/octet-stream',
            'X-Storage-U': userUid,
          },
          'POST',
        );

        if (imageUploadRes.code !== 2000) {
          reject(imageUploadRes.message);
          return;
        }

        const commitImgParams = {
          Action: 'CommitImageUpload',
          ServiceId: 'jm8ajry58r',
          Version: '2018-08-01',
          app_id: 2906,
          user_id: userUid,
        };

        const commitImgContent = {
          SessionKey: UploadAddress.SessionKey,
        };

        const commitImgHead = await this.generateAuthorizationAndHeader(
          uploadAuth.AccessKeyID,
          uploadAuth.SecretAccessKey,
          uploadAuth.SessionToken,
          'cn-north-1',
          'imagex',
          'POST',
          commitImgParams,
          commitImgContent,
        );

        // 提交图片上传
        const commitImg = await this.makeRequest(
          this.getUploadImageProofUrl +
            '?' +
            this.httpBuildQuery(commitImgParams),
          {
            method: 'POST',
            headers: {
              ...commitImgHead,
              'Content-Type': 'application/json',
            },
            data: JSON.stringify(commitImgContent),
            timeout: 60000,
          },
        );

        if (commitImg['ResponseMetadata'].hasOwnProperty('Error')) {
          reject(commitImg['ResponseMetadata']['Error']['Message']);
          return;
        }

        resolve(commitImg.Result.Results[0].Uri);
      } catch (err: any) {
        console.error('上传封面文件失败:', err);
        const errorMessage = err?.message || err || '未知';
        reject('封面上传失败,失败原因:' + errorMessage);
      }
    });
  }

  /**
   * 视频作品发布
   */
  async publishVideoWorkApi(
    cookies: string,
    tokens: any,
    filePath: string,
    platformSetting: PlatformSettingType,
    callback: (progress: number, msg?: string) => void,
  ): Promise<any> {
    console.log('开始发布视频作品，参数：', platformSetting);

    return new Promise(async (resolve, reject) => {
      try {
        // 初始化cookie
        console.log('开始转换cookie...');
        callback(5, '正在加载');
        const cookieString = CommonUtils.convertCookieToJson(cookies);
        callback(10);
        console.log('cookie转换结果:', cookieString);

        // 获取用户Uid
        console.log('开始获取用户Uid...');
        const userUid = await this.getUserUid(cookieString);
        callback(15);
        console.log('获取到的用户Uid:', userUid);

        // 上传封面图片 获取封面图片poster参数值
        console.log('开始上传封面图片...');
        console.log('封面图片路径:', platformSetting.cover);
        const poster = await this.uploadCoverFile(
          platformSetting.cover,
          cookieString,
          userUid,
        );
        callback(20);
        console.log('获取到的封面图片poster:', poster);

        // 上传视频 获取视频video_id参数值
        console.log('开始上传视频...');
        console.log('视频文件路径:', filePath);
        callback(30, '正在上传视频...');
        const videoId = await this.uploadVideo(filePath, cookieString, userUid);
        callback(50, '视频上传完成');
        console.log('获取到的视频ID:', videoId);

        // 发布视频参数
        console.log('开始获取发布参数...');
        const publishVideoParams =
          this.getPublishPublicParamsV2(platformSetting);
        console.log('发布参数:', publishVideoParams);
        callback(55, '参数获取完成');

        // 拼接视频封面内容
        publishVideoParams.item.common.video_id = videoId;
        publishVideoParams.item.cover.poster = poster;
        console.log('完整的发布参数:', publishVideoParams);

        // 获取csrf-token
        console.log(`[${new Date().toLocaleString()}] 开始获取csrf-token...`);
        const csrfToken = await this.getSecsdkCsrfToken(cookieString);
        console.log(
          `[${new Date().toLocaleString()}] 获取到的csrf-token:`,
          csrfToken,
        );
        callback(70, '正在发布...');

        // 获取bd-ticket
        console.log(`[${new Date().toLocaleString()}] 开始获取bd-ticket...`);
        const bdTicketHeaders = await this.getBdTicketHeaders(tokens);
        console.log(
          `[${new Date().toLocaleString()}] 获取到的bd-ticket headers:`,
          bdTicketHeaders,
        );

        // 发布视频
        console.log(
          `[${new Date().toLocaleString()}] 开始发布视频请求...`,
          this.publishUrlV2,
        );
        console.log(
          `[${new Date().toLocaleString()}] 发布参数:`,
          publishVideoParams,
        );
        const publishResult = await requestNet({
          url: this.publishUrlV2,
          method: 'POST',
          headers: {
            Cookie: cookieString,
            'X-Secsdk-Csrf-Token': csrfToken,
            ...bdTicketHeaders,
          },
          body: publishVideoParams,
        });
        callback(100, '发布完成');
        console.log(
          `[${new Date().toLocaleString()}] 发布请求结果:`,
          publishResult,
        );

        if (publishResult.status === 403 || publishResult.data === null) {
          console.error(
            `[${new Date().toLocaleString()}] 发布失败，状态码403或返回数据为空`,
          );
          reject('请重新授权账号后发布,如多次失败,请联系技术处理!');
          return false;
        }

        if (
          !publishResult.data.hasOwnProperty('status_code') ||
          publishResult.data.status_code !== 0
        ) {
          console.error(
            `[${new Date().toLocaleString()}] 发布失败，状态码异常:`,
            publishResult.data.status_code,
          );
          reject(publishResult.data.status_msg || '发布失败,账号可能已掉线!');
          return false;
        }

        const response = {
          publishTime: Math.floor(Date.now() / 1000),
          publishId: publishResult.data.item_id,
          shareLink: `https://www.douyin.com/user/self?from_tab_name=main&modal_id=${publishResult.data.item_id}&showTab=post`,
        };
        console.log(
          `[${new Date().toLocaleString()}] 发布成功，返回数据:`,
          response,
        );
        resolve(response);
      } catch (err) {
        console.error('发布视频过程中出现错误:', err);
        callback(-1);
        reject(err);
      }
    });
  }

  /**
   * 图片作品发布
   * @param cookies cookie信息
   * @param tokens 用户令牌
   * @param imagePath 图片路径
   * @param platformSetting 平台设置参数
   */
  async publishImageWorkApi(
    cookies: any,
    tokens: any,
    imagePath: string[],
    platformSetting: any,
  ): Promise<any> {
    console.log(`[${new Date().toLocaleString()}] 开始发布图片作品，参数:`, {
      cookies: typeof cookies === 'string' ? cookies.length : cookies.length,
      tokens,
      imagePath,
      platformSetting,
    });

    return new Promise(async (resolve, reject) => {
      try {
        // 初始化cookie
        console.log(`[${new Date().toLocaleString()}] 开始转换cookie...`);
        const cookieString = CommonUtils.convertCookieToJson(cookies);
        console.log(
          `[${new Date().toLocaleString()}] cookie转换结果:`,
          cookieString,
        );

        // 获取用户Uid
        console.log(`[${new Date().toLocaleString()}] 开始获取用户Uid...`);
        const userUid = await this.getUserUid(cookieString);
        console.log(
          `[${new Date().toLocaleString()}] 获取到的用户Uid:`,
          userUid,
        );

        const images = [];
        // 上传图片
        console.log(
          `[${new Date().toLocaleString()}] 开始上传图片，共${imagePath.length}张...`,
        );
        for (const [index, imgUrl] of imagePath.entries()) {
          console.log(
            `[${new Date().toLocaleString()}] 开始上传第${index + 1}张图片:`,
            imgUrl,
          );
          // 上传图片 获取poster
          const poster = await this.uploadCoverFile(
            imgUrl,
            cookieString,
            userUid,
          );
          console.log(
            `[${new Date().toLocaleString()}] 第${index + 1}张图片上传完成，poster:`,
            poster,
          );

          // 获取图片信息
          console.log(
            `[${new Date().toLocaleString()}] 开始获取第${index + 1}张图片信息...`,
          );
          const posterInfo = await this.makeRequest(
            imgUrl + '?x-oss-process=image/info',
            {
              method: 'GET',
              dataType: 'json',
              timeout: 60000,
            },
          );
          console.log(
            `[${new Date().toLocaleString()}] 获取到第${index + 1}张图片信息:`,
            posterInfo,
          );

          images.push({
            uri: poster,
            width: parseInt(posterInfo.ImageWidth.value),
            height: parseInt(posterInfo.ImageHeight.value),
          });
        }
        console.log(
          `[${new Date().toLocaleString()}] 所有图片上传完成，图片信息:`,
          images,
        );

        // 获取公共请求参数
        console.log(`[${new Date().toLocaleString()}] 开始获取发布参数...`);
        const publishImgParams = this.getPublishPublicParams(platformSetting);
        // 拼接图文内容
        publishImgParams.images = images;
        console.log(
          `[${new Date().toLocaleString()}] 获取到的发布参数:`,
          publishImgParams,
        );

        // 获取csrf-token
        console.log(`[${new Date().toLocaleString()}] 开始获取csrf-token...`);
        const csrfToken = await this.getSecsdkCsrfToken(cookieString);
        console.log(
          `[${new Date().toLocaleString()}] 获取到的csrf-token:`,
          csrfToken,
        );

        // 获取bd-ticket
        console.log(`[${new Date().toLocaleString()}] 开始获取bd-ticket...`);
        const bdTicketHeaders = await this.getBdTicketHeaders(tokens);
        console.log(
          `[${new Date().toLocaleString()}] 获取到的bd-ticket headers:`,
          bdTicketHeaders,
        );

        // 发布图文
        console.log(`[${new Date().toLocaleString()}] 开始发布图文请求...`);
        const publishResult = await this.makePublishRequest(this.publishUrl, {
          method: 'POST',
          headers: {
            Cookie: cookieString,
            'X-Secsdk-Csrf-Token': csrfToken,
            ...bdTicketHeaders,
          },
          data: publishImgParams,
        });
        console.log(
          `[${new Date().toLocaleString()}] 发布请求结果:`,
          publishResult,
        );

        if (publishResult.status === 403 || publishResult.data === null) {
          console.error(
            `[${new Date().toLocaleString()}] 发布失败，状态码403或返回数据为空`,
          );
          reject('请重新授权账号后发布,如多次失败,请联系技术处理!');
          return false;
        }

        if (
          !publishResult.hasOwnProperty('status_code') ||
          publishResult.status_code !== 0
        ) {
          console.error(
            `[${new Date().toLocaleString()}] 发布失败，状态码异常:`,
            publishResult.status_code,
          );
          reject(publishResult.status_msg || '发布失败,账号可能已掉线!');
          return false;
        }

        const response = {
          publishTime: Math.floor(Date.now() / 1000),
          publishId: publishResult.aweme.aweme_id,
          shareLink: '',
        };
        console.log(
          `[${new Date().toLocaleString()}] 发布成功，返回数据:`,
          response,
        );
        resolve(response);
      } catch (err) {
        console.error(
          `[${new Date().toLocaleString()}] 发布图片作品失败:`,
          err,
        );
        reject(err);
      }
    });
  }

  /**
   * 创建授权窗口
   */
  private async createAuthorizationWindow(cookies: any = null) {
    return new Promise<{ winContentsId: number; partition: string }>(
      async (resolve) => {
        // 生成随机partition
        const partition = Date.now().toString();

        // 获取屏幕尺寸
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;

        // 创建窗口
        const win = new BrowserWindow({
          width: Math.ceil(width * 0.9),
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

        // 载入URL及设置userAgent
        win.loadURL(this.loginUrl, {
          userAgent: this.defaultUserAgent,
        });

        // 显示页面并设置置顶
        win.once('ready-to-show', () => {
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
          delete this.windowMap[winContentsId];
        });

        // 监听窗口加载完成
        win.webContents.on('did-finish-load', async () => {
          if (win.webContents.getURL() === this.loginUrl) {
            let checkEleNum = 0;
            while (true) {
              if (checkEleNum >= 10) break;
              if (!win || win.isDestroyed()) break;

              const hasEle = await win.webContents.executeJavaScript(`
              (function() {
                return document.querySelector('.dux-icon-14') !== null;
              })()
            `);

              if (hasEle) {
                await win.webContents.executeJavaScript(`
                (function() {
                  document.querySelector('.dux-icon-14').parentElement.parentElement.style.display = 'none'
                })()
              `);
                break;
              }
              checkEleNum++;
              await CommonUtils.waitFor(1000);
            }
          }
          resolve({ winContentsId, partition });
        });
      },
    );
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
      console.log(`开始请求 [${new Date().toLocaleString()}]`);
      console.log('请求URL:', url);
      console.log('请求方法:', method);
      console.log('请求头:', headers);

      const request = net.request({
        method: method,
        url: url,
        headers: headers,
      });

      request.on('response', (response) => {
        console.log(
          `收到响应 [${new Date().toLocaleString()}], 状态码:`,
          response.statusCode,
        );
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log('响应数据:', data);
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
        console.log(`请求发送完成 [${new Date().toLocaleString()}]`);
      } catch (err) {
        console.error('写入请求体时出错:', err);
        reject(err);
      }
    });
  }

  /**
   * 获取上传凭证所需Ak和Tk
   */
  private async getUploadAuth(cookieString: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('开始获取上传凭证...');
        const authRes = await this.makeRequest(this.getUploadAuthUrl, {
          method: 'GET',
          headers: {
            Cookie: cookieString,
          },
          timeout: 15000,
        });
        console.log('获取上传凭证结果:', authRes);

        if (
          !authRes.hasOwnProperty('status_code') ||
          authRes.status_code !== 0
        ) {
          reject(authRes.status_msg ?? '获取上传凭证失败,账号可能已掉线!');
          return;
        }
        resolve(JSON.parse(authRes.auth));
      } catch (err) {
        console.error('获取上传凭证失败:', err);
        reject(err);
      }
    });
  }

  /**
   * 生成请求所需Header
   */
  private async generateAuthorizationAndHeader(
    accessKeyID: string,
    secretAccessKey: string,
    sessionToken: string,
    region: string,
    service: string,
    requestMethod: string,
    requestParams: any,
    requestBody: any = {},
  ): Promise<any> {
    return new Promise((resolve) => {
      // 获取当前ISO时间
      const now = new Date();
      const amzDate = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

      // 生成请求的Header
      const requestHeaders = this.addHeaders(
        amzDate,
        sessionToken,
        requestBody,
      );

      // 生成请求的Authorization
      const authorizationParams = [
        'AWS4-HMAC-SHA256 Credential=' +
          accessKeyID +
          '/' +
          this.credentialString(amzDate, region, service),
        'SignedHeaders=' + this.signedHeaders(requestHeaders),
        'Signature=' +
          this.signature(
            secretAccessKey,
            amzDate,
            region,
            service,
            requestMethod,
            requestParams,
            requestHeaders,
            requestBody,
          ),
      ];
      const authorization = authorizationParams.join(', ');

      // 返回Headers
      const headers: any = {};
      for (const key in requestHeaders) {
        headers[key] = requestHeaders[key];
      }
      headers['Authorization'] = authorization;
      resolve(headers);
    });
  }

  /**
   * 生成请求所需Header
   */
  private addHeaders(
    amzDate: string,
    sessionToken: string,
    requestBody: any,
  ): any {
    const headers = {
      'X-Amz-Date': amzDate,
      'X-Amz-Security-Token': sessionToken,
    };
    if (Object.keys(requestBody).length > 0) {
      // @ts-ignore
      headers['X-Amz-Content-Sha256'] = crypto
        .createHash('sha256')
        .update(JSON.stringify(requestBody))
        .digest('hex');
    }
    return headers;
  }

  /**
   * 获取credentialString
   */
  private credentialString(
    amzDate: string,
    region: string,
    service: string,
  ): string {
    const credentialArr = [
      amzDate.substring(0, 8),
      region,
      service,
      'aws4_request',
    ];
    return credentialArr.join('/');
  }

  /**
   * 生成随机数+字母
   */
  private generateRandomString(length: number): string {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * 获取signedHeaders
   */
  private signedHeaders(requestHeaders: any): string {
    const headers: string[] = [];
    Object.keys(requestHeaders).forEach(function (r) {
      r = r.toLowerCase();
      headers.push(r);
    });
    return headers.sort().join(';');
  }

  /**
   * 生成canonicalString
   */
  private canonicalString(
    requestMethod: string,
    requestParams: any,
    requestHeaders: any,
    requestBody: any,
  ): string {
    let canonicalHeaders: string[] = [];
    const headerKeys = Object.keys(requestHeaders).sort();
    for (let i = 0; i < headerKeys.length; i++) {
      canonicalHeaders.push(
        headerKeys[i].toLowerCase() + ':' + requestHeaders[headerKeys[i]],
      );
    }
    // @ts-ignore
    canonicalHeaders = canonicalHeaders.join('\n') + '\n';

    let body = '';
    if (Object.keys(requestBody).length > 0) {
      body = JSON.stringify(requestBody);
    }

    const canonicalStringArr = [
      requestMethod.toUpperCase(),
      '/',
      this.httpBuildQuery(requestParams),
      canonicalHeaders,
      this.signedHeaders(requestHeaders),
      crypto.createHash('sha256').update(body).digest('hex'),
    ];
    return canonicalStringArr.join('\n');
  }

  /**
   * 获取signature
   */
  private signature(
    secretAccessKey: string,
    amzDate: string,
    region: string,
    service: string,
    requestMethod: string,
    requestParams: any,
    requestHeaders: any,
    requestBody: any,
  ): string {
    // 生成signingKey
    const amzDay = amzDate.substring(0, 8);
    const kDate = crypto
      .createHmac('sha256', 'AWS4' + secretAccessKey)
      .update(amzDay)
      .digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update(service)
      .digest();
    const signingKey = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest();

    // 生成StringToSign
    const stringToSignArr = [
      'AWS4-HMAC-SHA256',
      amzDate,
      this.credentialString(amzDate, region, service),
      crypto
        .createHash('sha256')
        .update(
          this.canonicalString(
            requestMethod,
            requestParams,
            requestHeaders,
            requestBody,
          ),
        )
        .digest('hex'),
    ];
    const stringToSign = stringToSignArr.join('\n');
    return crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * 生成http请求参数字符串
   */
  private httpBuildQuery(params: any): string {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        searchParams.append(key, params[key]);
      }
    }
    return searchParams.toString();
  }

  /**
   * 获取网站登录cookie
   */
  private async filterCookie(
    winContentsId: number,
    partition: string,
  ): Promise<Electron.Cookie[]> {
    return new Promise((resolve, reject) => {
      // 监听cookie状态
      this.cookieIntervalList[winContentsId] = setInterval(async () => {
        try {
          const cookies = await session
            .fromPartition(partition)
            .cookies.get({});

          const alreadyLogin = cookies.some((item) =>
            item.name.includes(this.cookieCheckField),
          );
          const hasSecUid = cookies.some((item) =>
            item.name.includes(this.cookieSecscdUidCheckField),
          );

          console.log('登录状态检查:', { alreadyLogin, hasSecUid });

          // 如果获取到登录状态cookie
          if (alreadyLogin && hasSecUid) {
            // 关闭定时器
            if (this.cookieIntervalList.hasOwnProperty(winContentsId)) {
              clearInterval(this.cookieIntervalList[winContentsId]);
              delete this.cookieIntervalList[winContentsId];
            }
            // 返回Cookie信息
            resolve(cookies);
          }
        } catch (err) {
          console.error('获取cookie失败:', err);
          reject('获取网站cookie失败');
        }
      }, 3000);
    });
  }

  /**
   * 获取私钥等信息
   */
  private async filterLocalStorage(winContentsId: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // 先从 windowMap 中获取窗口
        let win = this.windowMap[winContentsId];

        // 如果 windowMap 中没有，尝试从 BrowserWindow 获取
        if (!win) {
          // @ts-ignore
          win = BrowserWindow.fromId(winContentsId);
        }

        // 如果仍然找不到窗口
        if (!win || win.isDestroyed()) {
          console.error('找不到窗口或窗口已销毁, ID:', winContentsId);
          reject('找不到有效的窗口');
          return;
        }

        let retryCount = 0;
        const maxRetries = 10; // 最大重试次数

        while (retryCount < maxRetries) {
          if (!win || win.isDestroyed()) {
            console.error('窗口已被销毁，停止获取 localStorage');
            reject('窗口已被销毁');
            break;
          }

          try {
            const hasLocalStorage = await win.webContents.executeJavaScript(`
              (function() {
                return window.localStorage['security-sdk/s_sdk_crypt_sdk'] !== undefined && 
                       window.localStorage['security-sdk/s_sdk_sign_data_key/web_protect'] !== undefined;
              })()
            `);

            if (hasLocalStorage) {
              const privateKey = await win.webContents.executeJavaScript(`
                (function() {
                  try {
                    const sdkData = window.localStorage['security-sdk/s_sdk_crypt_sdk'];
                    const parsedData = JSON.parse(sdkData);
                    const parsedInnerData = JSON.parse(parsedData.data);
                    return parsedInnerData.ec_privateKey;
                  } catch (e) {
                    console.error('解析 privateKey 失败:', e);
                    return null;
                  }
                })()
              `);

              const webProtect = await win.webContents.executeJavaScript(`
                (function() {
                  try {
                    const protectData = window.localStorage['security-sdk/s_sdk_sign_data_key/web_protect'];
                    const parsedData = JSON.parse(protectData);
                    return parsedData.data;
                  } catch (e) {
                    console.error('解析 webProtect 失败:', e);
                    return null;
                  }
                })()
              `);

              if (!privateKey || !webProtect) {
                throw new Error('获取到的 privateKey 或 webProtect 为空');
              }

              resolve(
                JSON.stringify({
                  privateKey: privateKey,
                  webProtect: webProtect,
                }),
              );
              break;
            }
          } catch (err) {
            console.error(
              `第 ${retryCount + 1} 次尝试获取 localStorage 失败:`,
              err,
            );
          }

          retryCount++;
          await CommonUtils.waitFor(1000);
        }

        if (retryCount >= maxRetries) {
          reject('获取 localStorage 超过最大重试次数');
        }
      } catch (err) {
        console.error('获取 localStorage 过程出错:', err);
        reject(err instanceof Error ? err.message : '获取 localStorage 失败');
      }
    });
  }

  /**
   * 获取用户Uid
   * @param cookieString
   */
  private async getUserUid(cookieString: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('开始获取用户Uid, 发起请求...');
        const userInfoRes = await this.makeRequest(this.getUserInfoUrl, {
          method: 'GET',
          headers: {
            Cookie: cookieString,
          },
          dataType: 'json',
          timeout: 15000,
        });
        console.log('获取用户信息响应:', userInfoRes);

        if (
          !userInfoRes.hasOwnProperty('status_code') ||
          userInfoRes.status_code !== 0
        ) {
          console.error('获取用户Uid失败:', userInfoRes.status_msg);
          reject(userInfoRes.status_msg ?? '获取用户Uid失败,账号可能已掉线!');
          return false;
        }

        console.log('成功获取用户Uid:', userInfoRes.user.uid);
        resolve(userInfoRes.user.uid);
      } catch (err) {
        console.error('获取用户Uid过程出错:', err);
        reject(err);
      }
    });
  }

  /**
   * 上传视频
   * @param filePath 视频文件路径
   * @param cookieString cookie字符串
   * @param userUid 用户ID
   */
  private async uploadVideo(
    filePath: string,
    cookieString: string,
    userUid: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('开始上传视频...');
        // 获取文件大小及分片信息
        const filePartInfo = await FileUtils.getFilePartInfo(
          filePath,
          this.fileBlockSize,
        );
        console.log('文件分片信息:', filePartInfo);

        // 获取上传令牌所需Ak和Tk
        const uploadAuth = await this.getUploadAuth(cookieString);
        console.log('获取到的上传令牌:', uploadAuth);

        // 获取视频上传凭证签名所需参数
        const getUploadVideoProofRequestParams = {
          Action: 'ApplyUploadInner',
          FileSize: filePartInfo.fileSize,
          FileType: 'video',
          IsInner: 1,
          SpaceName: 'aweme',
          Version: '2020-11-19',
          app_id: 2906,
          s: this.generateRandomString(11),
          user_id: userUid.toString(),
        };

        // 获取视频上传凭证签名
        const requestHeadersInfo = await this.generateAuthorizationAndHeader(
          uploadAuth.AccessKeyID,
          uploadAuth.SecretAccessKey,
          uploadAuth.SessionToken,
          'cn-north-1',
          'vod',
          'GET',
          getUploadVideoProofRequestParams,
        );

        // 获取视频上传凭证
        const uploadRes = await this.makeRequest(
          this.getUploadVideoProofUrl +
            '?' +
            this.httpBuildQuery(getUploadVideoProofRequestParams),
          {
            method: 'GET',
            headers: requestHeadersInfo,
            dataType: 'json',
            timeout: 15000,
          },
        );
        console.log('获取视频上传凭证结果:', uploadRes);

        if (uploadRes['ResponseMetadata'].hasOwnProperty('Error')) {
          reject(uploadRes['ResponseMetadata']['Error']['Message']);
          return false;
        }

        // 获取上传节点信息
        const uploadNodes = uploadRes.Result.InnerUploadAddress.UploadNodes[0];
        const storeUri = uploadNodes.StoreInfos[0].StoreUri;
        const uploadUrl = `https://${uploadNodes.UploadHost}/upload/v1/${storeUri}`;

        // 生成UploadUuid
        const uploadUuId = uuidv4();

        // 公共上传参数
        const uploadParams = {
          uploadid: uploadUuId,
          uploadmode: null,
          phase: 'transfer',
        };

        // 上传分片数据
        const uploadBlockRes: string[] = [];
        console.log('开始分片上传...');

        // 开始上传
        for (const i in filePartInfo.blockInfo) {
          console.log(`开始上传第 ${parseInt(i) + 1} 个分片...`);
          // 设置当前文件分片信息
          const nowUploadParams = JSON.parse(JSON.stringify(uploadParams));
          nowUploadParams['part_number'] = parseInt(i) + 1;
          nowUploadParams['part_offset'] = parseInt(i) * this.fileBlockSize;

          // 获取分片内容
          const chunkStart =
            i === '0' ? 0 : filePartInfo.blockInfo[parseInt(i) - 1];
          const chunkEnd = filePartInfo.blockInfo[i] - 1;
          const chunkContent = await FileUtils.getFilePartContent(
            filePath,
            chunkStart,
            chunkEnd,
          );

          // 获取文件crc32
          const fileCrc32 = crc32(chunkContent).toString(16);

          // 执行分片上传
          const uploadPartRes = await this.uploadFile(
            uploadUrl + '?' + this.httpBuildQuery(nowUploadParams),
            chunkContent,
            {
              Authorization: uploadNodes.StoreInfos[0].Auth,
              'Content-Crc32': fileCrc32,
              'Content-Type': 'application/octet-stream',
              'X-Logical-Part-Mode':
                uploadNodes.UploadHeader['X-Logical-Part-Mode'],
              'X-Storage-U': userUid,
            },
            'POST',
          );
          console.log(`第 ${parseInt(i) + 1} 个分片上传结果:`, uploadPartRes);

          if (uploadPartRes === null) {
            reject('上传文件失败');
            return false;
          }

          if (uploadPartRes.code !== 2000) {
            reject(uploadPartRes.message);
            return false;
          }

          // 上传分片成功
          uploadBlockRes.push(
            `${uploadPartRes.data.part_number}:${uploadPartRes.data.crc32}`,
          );
        }

        // 分片上传完成,合并分片
        console.log('所有分片上传完成，开始合并...');
        const uploadBlockResStr = uploadBlockRes.join(',');
        uploadParams.phase = 'finish';
        // @ts-ignore
        uploadParams.uploadmode = 'part';

        // 请求分片合成
        const uploadFinishRes = await this.uploadFile(
          uploadUrl + '?' + this.httpBuildQuery(uploadParams),
          Buffer.from(uploadBlockResStr),
          {
            Authorization: uploadNodes.StoreInfos[0].Auth,
            'Content-Type': 'text/plain;charset=UTF-8',
            'X-Logical-Part-Mode':
              uploadNodes.UploadHeader['X-Logical-Part-Mode'],
            'X-Storage-U': userUid,
          },
          'POST',
        );
        console.log('分片合并结果:', uploadFinishRes);

        if (uploadFinishRes === null) {
          reject('合成文件分片失败');
          return false;
        }

        if (uploadFinishRes.code !== 2000) {
          reject(uploadFinishRes.message);
          return false;
        }

        // 分片合并完成,提交CommitUploadInner
        const commitRequestParams = {
          Action: 'CommitUploadInner',
          SpaceName: 'aweme',
          Version: '2020-11-19',
          app_id: 2906,
          user_id: userUid,
        };

        const commitRequestBody = {
          SessionKey: uploadNodes.SessionKey,
          Functions: [],
        };

        // 生成请求令牌
        const commitRequestHeadersInfo =
          await this.generateAuthorizationAndHeader(
            uploadAuth.AccessKeyID,
            uploadAuth.SecretAccessKey,
            uploadAuth.SessionToken,
            'cn-north-1',
            'vod',
            'POST',
            commitRequestParams,
            commitRequestBody,
          );

        // 请求CommitUploadInner
        const commitRes = await this.makeRequest(
          this.getUploadVideoProofUrl +
            '?' +
            this.httpBuildQuery(commitRequestParams),
          {
            method: 'POST',
            headers: commitRequestHeadersInfo,
            data: JSON.stringify(commitRequestBody),
            dataType: 'json',
            timeout: 60000,
          },
        );
        console.log('提交上传结果:', commitRes);

        if (commitRes['ResponseMetadata'].hasOwnProperty('Error')) {
          reject(commitRes['ResponseMetadata']['Error']['Message']);
          return false;
        }

        console.log('视频上传成功，视频ID:', commitRes.Result.Results[0].Vid);
        resolve(commitRes.Result.Results[0].Vid);
      } catch (err) {
        console.error('视频上传过程出错:', err);
        let errorMessage;
        // @ts-ignore
        if (err && err.message) {
          // @ts-ignore
          errorMessage = err.message;
        } else if (err) {
          errorMessage = err;
        } else {
          errorMessage = '未知';
        }
        reject('视频上传失败,失败原因:' + errorMessage);
      }
    });
  }

  // 发布视频、v2 api参数处理
  private getPublishPublicParamsV2(platformSetting: PlatformSettingType) {
    console.log('platformSetting：', platformSetting);
    const parmasDisposeOK = this.getPublishPublicParams(platformSetting);

    return {
      item: {
        anchor: parmasDisposeOK.hasOwnProperty('poi_id')
          ? {
              anchor_content: JSON.stringify({
                is_commerce_intention: false,
              }),
              poi_id: parmasDisposeOK.poi_id,
              poi_name: parmasDisposeOK.poi_name,
            }
          : {},
        assistant: {
          is_post_assistant: 1,
          is_preview: 0,
        },
        chapter: {
          chapter: JSON.stringify({
            chapter_abstract: '',
            chapter_details: [],
            chapter_type: 0,
            chapter_tools_info: {
              chapter_recommend_detail: [],
              chapter_recommend_abstract: '',
              chapter_source: 2,
              chapter_recommend_type: -2,
              create_date: 1741767807,
              is_pc: '1',
              is_pre_generated: '0',
              is_syn: '1',
            },
          }),
        },
        common: {
          // 活动
          activity: parmasDisposeOK.activity,
          text: parmasDisposeOK.text,
          item_title: parmasDisposeOK.item_title,
          text_extra: JSON.stringify(parmasDisposeOK.text_extra),
          // 挑战
          challenges: JSON.stringify([]),
          creation_id: '',
          // 是否允许下载
          download: 1,
          hashtag_source: 'recommend/recommend/recommend',
          // 热点中文
          hot_sentence: platformSetting.hot_sentence,
          // 标题
          media_type: 4,
          mentions: JSON.stringify(parmasDisposeOK.mentions),
          music_id: '',
          video_id: '',
          music_source: 0,
          // 定时,
          timing: parmasDisposeOK.timing,
          // 可见性
          visibility_type: platformSetting['visibility_type'],
        },
        cover: {
          cover_text: null,
          cover_text_uri: null,
          cover_tools_extend_info: '{}',
          cover_tools_info: JSON.stringify({}),
          poster: '',
          poster_delay: 0,
        },
        declare: platformSetting.userDeclare
          ? {
              user_declare_info: JSON.stringify({
                // 内容由AI生成
                choose_value: platformSetting.userDeclare,
              }),
            }
          : {},
        mix: {},
        open_platform: {},
        sync: {
          should_sync: false,
          sync_to_toutiao: 0,
        },
      },
    };
  }

  /**
   * 获取视频|图文公共发布参数
   * @param platformSetting 平台设置参数
   */
  private getPublishPublicParams(platformSetting: PlatformSettingType): any {
    console.log('开始处理发布参数...');
    // 处理描述
    let text = `${platformSetting['title'] || ''} ${platformSetting['caption'] || ''}`;
    // 标题扩展属性
    const textExtra = [];
    // @好友参数
    const mentions = [];

    // 处理话题
    if (
      (platformSetting.topics && platformSetting.topics?.length > 0) ||
      (platformSetting.activity && platformSetting.activity?.length > 0)
    ) {
      console.log('处理话题标签...');
      for (const topic of [
        ...(platformSetting.topics || []),
        ...(platformSetting.activity?.map((v) => v.label) || []),
      ]) {
        // 扩展属性追加话题位置
        const extraItem = {
          start: text.length,
          type: 1,
          hashtag_name: topic,
          hashtag_id: 0,
          user_id: '',
          caption_start: 0,
          caption_end: 0,
        };
        // 标题追加话题
        text += `#${topic} `;
        // 计算话题结束位置
        // @ts-ignore
        extraItem.end = text.length - 1;
        // 追加到扩展属性
        textExtra.push(extraItem);
      }
    }

    // 处理@好友
    if (
      platformSetting.hasOwnProperty('mentionedUserInfo') &&
      platformSetting.mentionedUserInfo &&
      platformSetting.mentionedUserInfo?.length > 0
    ) {
      console.log('处理@好友...');
      for (const userInfo of platformSetting.mentionedUserInfo) {
        if (userInfo.hasOwnProperty('nickName') && userInfo.nickName !== '') {
          // 扩展属性追加@好友位置
          const extraItem = {
            start: text.length,
            type: 0,
            hashtag_name: '',
            hashtag_id: 0,
            user_id: userInfo.uid,
            caption_start: 0,
            caption_end: 0,
          };
          // 标题追加@好友
          text += ` @${userInfo.nickName}`;
          // 计算话题结束位置
          // @ts-ignore
          extraItem.end = text.length;
          // 追加到扩展属性
          textExtra.push(extraItem);
          // 追加到@好友
          mentions.push(userInfo.uid);
        }
      }
    }

    // 整合发布参数
    const publishParams = {
      item_title: platformSetting['title'] ?? '',
      text,
      text_extra: textExtra,
      mentions: mentions,
      // 0 公共 1 私密 2 好友
      visibility_type: platformSetting['visibility_type'],
      download: 1,
      activity: JSON.stringify(
        platformSetting.activity?.map((v) => v.value) || [],
      ),
    };

    // 处理合集
    if (
      platformSetting.hasOwnProperty('mixInfo') &&
      typeof platformSetting.mixInfo === 'object' &&
      platformSetting.mixInfo.hasOwnProperty('mixId') &&
      platformSetting.mixInfo.hasOwnProperty('mixName')
    ) {
      console.log('处理合集信息...');
      // @ts-ignore
      publishParams.mix_id = platformSetting.mixInfo.mixId;
    }

    // 处理POI
    if (
      platformSetting.hasOwnProperty('poiInfo') &&
      typeof platformSetting.poiInfo === 'object' &&
      platformSetting.poiInfo.hasOwnProperty('poiId') &&
      platformSetting.poiInfo.poiId !== ''
    ) {
      console.log('处理POI信息...');
      // @ts-ignore
      publishParams.poi_id = platformSetting.poiInfo.poiId;
      // @ts-ignore
      publishParams.poi_name = platformSetting.poiInfo.poiName;
    }

    // 处理背景音乐
    if (
      platformSetting.hasOwnProperty('musicId') &&
      platformSetting.musicId !== ''
    ) {
      console.log('处理背景音乐...');
      // @ts-ignore
      publishParams.music_id = platformSetting.musicId;
    }

    // 处理定时
    if (
      platformSetting.hasOwnProperty('timingTime') &&
      platformSetting.timingTime &&
      platformSetting.timingTime > Date.now()
    ) {
      console.log('处理定时发布...');
      // @ts-ignore
      publishParams.timing = Math.floor(platformSetting.timingTime / 1000);
    }

    console.log('最终发布参数:', publishParams);
    return publishParams;
  }

  /**
   * HEAD请求专用方法
   */
  private async makeHeadRequest(
    url: string,
    cookieString: string,
  ): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        // @ts-ignore
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Cookie: cookieString,
          Authority: 'creator.douyin.com',
          Priority: 'u=1, i',
          Referer: 'https://creator.douyin.com/creator-micro/home',
          'Sec-Ch-Ua':
            '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'X-Secsdk-Csrf-Request': 1,
          'X-Secsdk-Csrf-Version': '1.2.22',
        },
      });

      // 获取响应头
      const headers: { [key: string]: string } = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const fft = {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
        ok: response.ok,
      };
      // console.log('fffff',fft)
      return fft;
    } catch (error) {
      console.error('HEAD请求失败:', error);
      throw new Error(
        `HEAD请求失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 获取SecsdkCsrfToken
   * @param cookieString cookie字符串
   */
  private async getSecsdkCsrfToken(cookieString: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('开始获取CSRF Token...');
        const csrfTokenRes = await this.makeHeadRequest(
          this.getCsrfTokenUrl,
          cookieString,
        );

        console.log('CSRF Token响应状态:', csrfTokenRes.status);
        if (csrfTokenRes.status !== 200) {
          console.error(
            '获取CSRF_TOKEN失败，状态码不是200:',
            csrfTokenRes.status,
          );
          reject('获取CSRF_TOKEN失败,请稍后重试!');
          return;
        }

        const headers = csrfTokenRes.headers;
        // console.log('CSRF Token响应头:', headers);

        if (!headers['x-ware-csrf-token']) {
          console.error('获取CSRF_TOKEN失败，响应头中没有x-ware-csrf-token');
          reject('获取CSRF_TOKEN失败,请稍后重试!');
          return;
        }

        const csrfToken = headers['x-ware-csrf-token'].split(',');
        console.log('成功获取CSRF Token:', csrfToken[1]);
        resolve(csrfToken[1]);
      } catch (err) {
        console.error('获取CSRF Token过程出错:', err);
        reject(err);
      }
    });
  }

  /**
   * 获取bd-Ticket请求头
   * @param tokens 用户令牌
   */
  private async getBdTicketHeaders(tokens: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (tokens === null || tokens === '' || tokens === undefined) {
        resolve({});
        return true;
      }

      try {
        tokens = JSON.parse(tokens);
        if (
          !tokens.hasOwnProperty('privateKey') ||
          !tokens.hasOwnProperty('webProtect')
        ) {
          reject('解析用户私钥失败,请重新授权!');
          return false;
        }

        const { privateKey, webProtect } = tokens;
        // 获取bd请求参数
        const bdRes = await this.makeRequest(
          'http://116.62.154.231:7879/index/index/douyin',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=UTF-8',
            },
            data: {
              privateKey: privateKey,
              webProtect: webProtect,
              path: '/web/api/media/aweme/create/',
            },
            dataType: 'json',
            timeout: 15000,
          },
        );

        resolve(bdRes);
      } catch (err) {
        console.error('获取bd-Ticket失败:', err);
        reject(err);
      }
    });
  }

  /**
   * 发布专用请求方法
   */
  private async makePublishRequest(url: string, options: any): Promise<any> {
    console.log(`[${new Date().toLocaleString()}] 开始发起发布请求...`);
    console.log(`[${new Date().toLocaleString()}] 请求URL:`, url);
    console.log(`[${new Date().toLocaleString()}] 请求参数:`, options);

    try {
      // 创建 FormData 对象
      const formData = new FormData();
      const postData = options.data;

      // 将数据添加到 FormData
      Object.keys(postData).forEach((key) => {
        if (typeof postData[key] === 'object') {
          formData.append(key, JSON.stringify(postData[key]));
        } else {
          formData.append(key, postData[key]);
        }
      });

      console.log(
        `[${new Date().toLocaleString()}] 请求体数据:`,
        Object.fromEntries(formData.entries()),
      );

      const response = await fetch(url, {
        method: options.method,
        headers: {
          ...options.headers,
        },
        body: formData,
      });

      console.log(
        `[${new Date().toLocaleString()}] 收到响应，状态码:`,
        response.status,
      );
      console.log(
        `[${new Date().toLocaleString()}] 响应头:`,
        Object.fromEntries(response.headers.entries()),
      );

      const responseText = await response.text();
      console.log(
        `[${new Date().toLocaleString()}] 原始响应数据长度:`,
        responseText.length,
      );
      console.log(
        `[${new Date().toLocaleString()}] 原始响应数据:`,
        responseText,
      );

      // 检查响应数据是否为空
      if (!responseText || responseText.trim() === '') {
        console.error(`[${new Date().toLocaleString()}] 响应数据为空`);
        throw new Error('服务器返回空数据');
      }

      try {
        const result = JSON.parse(responseText);
        console.log(
          `[${new Date().toLocaleString()}] 解析后的响应数据:`,
          result,
        );

        if (!result) {
          console.error(`[${new Date().toLocaleString()}] 解析后的数据为空`);
          throw new Error('解析后的数据为空');
        }

        return result;
      } catch (err) {
        console.error(
          `[${new Date().toLocaleString()}] 解析响应数据失败:`,
          err,
        );
        console.error(
          `[${new Date().toLocaleString()}] 导致错误的原始数据:`,
          responseText,
        );
        throw new Error(
          `解析响应数据失败: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleString()}] 请求发生错误:`, error);
      throw new Error(
        `请求失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 获取话题
  async getTopics({ keyword }: { keyword: string }) {
    return await requestNet<DouyinTopicsSugResponse>({
      url: `${this.loginUrl}aweme/v1/search/challengesug/?aid=1&keyword=${keyword}`,
      method: 'GET',
    });
  }

  // 获取位置数据
  async getLocation(params: {
    keywords: string;
    latitude: number;
    longitude: number;
    cookie: Electron.Cookie[];
  }) {
    return await requestNet<DouyinLocationDataResponse>({
      url: `${this.loginUrl}aweme/v1/life/video_api/search/poi/?${jsonToQueryString(
        {
          ...params,
          page: 1,
          from_webapp: 1,
        },
      )}`,
      headers: {
        cookie: CookieToString(params.cookie),
      },
      method: 'GET',
    });
  }

  // 获取热点数据
  async getHotspotData(params: { query: string; cookie: Electron.Cookie[] }) {
    return await requestNet<DouyinHotDataResponse>({
      url: `${this.loginUrl}aweme/v1/hotspot/search/?${jsonToQueryString({
        ...params,
        count: 50,
      })}`,
      headers: {
        cookie: CookieToString(params.cookie),
      },
      method: 'GET',
    });
  }

  // 获取默认热点数据，默认热点数据是没有搜索热点数据之前展示的默认数据
  async getAllHotspotData() {
    return await requestNet<DouyinAllHotDataResponse>({
      url: `${this.loginUrl}aweme/v1/hotspot/recommend`,
      method: 'GET',
    });
  }

  // 查询抖音的活动列表
  async getActivity(cookie: Electron.Cookie[]) {
    return await requestNet<DouyinActivityListResponse>({
      url: `https://creator.douyin.com/web/api/media/activity/get/?page=1&size=9999`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'GET',
    });
  }

  // 获取活动详情
  async getActivityDetails(cookie: Electron.Cookie[], activity_id: string) {
    console.log(activity_id);
    return await requestNet<DouyinActivityDetailResponse>({
      url: `https://creator.douyin.com/web/api/media/activity/detail/?activity_id=${activity_id}`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'GET',
    });
  }

  // 获取抖音活动标签
  async getActivityTags(cookie: Electron.Cookie[]) {
    return await requestNet<DouyinActivityTagsResponse>({
      url: `https://creator.douyin.com/web/api/media/activity/tags/query`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'GET',
    });
  }

  // 获取@的用户
  async getUsers(cookie: Electron.Cookie[], keyword: string, page: number) {
    return await requestNet<DouyinUserListResponse>({
      url: `https://creator.douyin.com/web/api/v2/discover/search/?search_source=publish_web&count=10&keyword=${keyword}&cursor=${(page - 1) * 10}&scene=1`,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'GET',
    });
  }

  /**
   * 查询抖音的作品列表
   * @param cookie
   * @param msToken
   * @returns
   */
  async getCreatorItems(cookie: Electron.Cookie[], cursor?: string) {
    const url = CommonUtils.buildUrl(
      'https://creator.douyin.com/aweme/v1/creator/item/list/',
      { cursor },
    );
    const res = await requestNet<DouyinCreatorListResponse>({
      url,
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'GET',
    });

    return res;
  }

  // 查看作品的评论列表
  async getCreatorCommentList(
    cookie: Electron.Cookie[],
    item_id: string, // 作品ID
    pageInfo: {
      cursor?: string;
      count?: number;
    },
  ) {
    const res = await requestNet<DouyinCreatorCommentListResponse>({
      url: CommonUtils.buildUrl(
        `https://creator.douyin.com/aweme/v1/creator/comment/list/`,
        {
          cursor: pageInfo.cursor,
          count: pageInfo.count,
          item_id: item_id,
          sort: 'TIME',
        },
      ),
      headers: {
        cookie: CookieToString(cookie),
      },
      method: 'GET',
    });

    return res;
  }

  // 作品的评论回复
  async creatorCommentReply(
    cookie: Electron.Cookie[],
    data: {
      comment_Id: string; // 空字符串, 直接回复
      item_id: string; // '@j/do779EQE//uctS8rzvvch6oCaTZCH0JqwsPqxpgahhkia+W5A7RJEoPQpq6PZl7wq9uxSqSWCjcIdbPzF8fQ==';
      text: string; //'哈哈哈';
    },
  ) {
    const cookieString = CommonUtils.convertCookieToJson(cookie);
    const csrfToken = await this.getSecsdkCsrfToken(cookieString);
    const res = await requestNet<DouyinNewCommentResponse>({
      url: `https://creator.douyin.com/aweme/v1/creator/comment/reply/`,
      headers: {
        cookie: cookieString,
        'X-Secsdk-Csrf-Token': csrfToken,
      },
      method: 'POST',
      body: data,
    });
    return res;
  }
}

// 导出服务实例
export const douyinService = new DouyinService();
