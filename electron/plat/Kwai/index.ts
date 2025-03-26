import requestNet, { IRequestNetParams } from '../requestNet';
import {
  CommentAddResponse,
  GetCommentListResponse,
  GetPhotoListResponse,
  GetSubCommentListResponse,
  IGetHomeInfoResponse,
  IGetHomeOverview,
  IKwaiGetLocationsResponse,
  IKwaiGetTopicsResponse,
  IKwaiGetUsersResponse,
  IKwaiPubVideoParams,
  IKwaiUserInfoResponse,
  ILoginResponse,
} from './kwai.type';
import { cookieToPlaywright, CookieToString } from '../utils';
import { BrowserWindow } from 'electron';
import { KwaiVisibleTypeEnum } from '../plat.common.type';
import { getBrowser } from '../coomont';
import kwaiSign from './sign/KwaiSign';

interface IRequestApiParams extends IRequestNetParams {
  cookie: Electron.Cookie[];
}

class KwaiPub {
  // 发布视频
  async pubVideo(params: IKwaiPubVideoParams): Promise<{
    success: boolean;
    msg: string;
  }> {
    const { callback } = params;
    return new Promise(async (resolve) => {
      const browser = await getBrowser();
      try {
        if (!browser) throw 'playwright 初始化失败！';
        callback(5, '正在加载...');

        const context = await browser.newContext();
        callback(10);
        // cookie添加到浏览器
        await context.addCookies(cookieToPlaywright(params.cookies));

        // 创建一个新的页面
        const page = await context.newPage();
        // 跳转到登录页面
        await page.goto(
          'https://id.kuaishou.com/pass/kuaishou/login/passToken?sid=kuaishou.web.cp.api',
        );
        // 跳转到上传视频页面
        await page.goto(
          'https://cp.kuaishou.com/article/publish/video?tabType=1',
        );
        // 设置新手教程隐藏
        await page.evaluate(() => {
          localStorage.setItem('PUBLISH_V2_TOUR', 'true');
        });
        callback(15);

        // 全局捕获错误弹出消息
        page
          .waitForSelector('.ant-message-error', {
            timeout: 1000 * 60 * 100,
          })
          .then(async (el) => {
            const text = await page.evaluate(
              (element) => element!.textContent,
              el,
            );
            resolve({
              success: false,
              msg: text || '系统繁忙，请稍后重试',
            });
            await browser.close();
          });

        // 寻找上传视频的按钮
        const uploadVideoBtn = await page.waitForSelector(
          'button:text("上传视频")',
        );
        callback(20, '正在上传视频...');
        // 触发上传视频
        const [videoFileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          uploadVideoBtn.click(),
        ]);
        // 选择视频文件
        await videoFileChooser.setFiles(params.videoPath);

        // 寻找文本域
        const textarea = await page.waitForSelector('#work-description-edit');
        await textarea.click();
        // 设置简介 触发粘贴事件
        await page.evaluate(
          ({ textarea, desc }) => {
            const pasteEvent = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: new DataTransfer(),
            });
            pasteEvent.clipboardData?.setData('text/plain', desc);
            textarea.dispatchEvent(pasteEvent);
          },
          { textarea, desc: params.desc },
        );

        // 设置私密性
        if (params.visibleType === KwaiVisibleTypeEnum.Private) {
          const privacyBtn = await page.waitForSelector(
            'span:text-is("仅自己可见")',
          );
          await privacyBtn.click();
        } else if (params.visibleType === KwaiVisibleTypeEnum.Friend) {
          const friendBtn = await page.waitForSelector(
            'span:text-is("好友可见")',
          );
          await friendBtn.click();
        }

        console.log('正在等待视频上传...');
        // 等待视频上传完成
        await page.waitForSelector('#preview-tours video', {
          timeout: 1000 * 60 * 10,
        });
        console.log('视频上传完成...');
        callback(40, '正在设置封面');

        // 设置封面
        // 触发封面hover
        const coverWrapView = await page.waitForSelector(
          '[class^="_default-cover_"]',
        );
        coverWrapView?.hover();
        // 点击背景的替换按钮
        const replaceBtn = await page.waitForSelector('div:text("封面设置")');
        await replaceBtn.click();
        const uploadCoverBtnView =
          await page.waitForSelector('div:text("上传封面")');
        await uploadCoverBtnView.click();

        const uploadImageBtn = await page.waitForSelector(
          'button:text("上传图片")',
        );
        const [coverFileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          uploadImageBtn?.click(),
        ]);
        await coverFileChooser.setFiles(params.coverPath);
        // 点击封面完成
        const finishBtn = await page.waitForSelector('span:text("确认")');
        await finishBtn.click();

        // 监听封面应用成功
        await page.waitForSelector('span:text("封面应用成功")');
        callback(70, '正在发布');

        // 寻找发布按钮并且触发
        const buttonPublish = await page.waitForSelector('div:text-is("发布")');
        await buttonPublish.click();

        // 验证是否发布成功
        await page.waitForSelector('h2:text-is("视频管理")');
        console.log('提交成功...');
        callback(100, '发布完成');

        await browser.close();

        resolve({
          success: true,
          msg: '发布成功！',
        });
      } catch (error) {
        console.log('操作执行失败：', error);
        resolve({
          success: false,
          msg: `${error}`,
        });
        callback(-1);
        await browser!.close();
      }
    });
  }

  // 发送请求
  async requestApi<T>(params: IRequestApiParams) {
    const { cookie } = params;

    if (params.method === 'POST') {
      params['body'] = {
        ...(params['body'] ? params['body'] : {}),
        'kuaishou.web.cp.api_ph': cookie.find(
          (v) => v.name === 'kuaishou.web.cp.api_ph',
        )!.value,
      };
    }

    params['headers'] = {
      ...(params['headers'] ? params['headers'] : {}),
      cookie: CookieToString(cookie),
    };

    const signUrl = await kwaiSign.sign({
      json: params.body || {},
      type: 'json',
      url: params.url,
    });

    console.log('signUrl：', signUrl);

    return await requestNet<T>({
      ...params,
      url: `https://cp.kuaishou.com${signUrl}`,
    });
  }

  async getHomeOverview(cookie: Electron.Cookie[]) {
    return await this.requestApi<IGetHomeOverview>({
      cookie,
      url: '/rest/cp/creator/analysis/pc/home/author/overview',
      method: 'POST',
      body: {
        timeType: 3,
      },
    });
  }

  // 快手登录
  login(): Promise<ILoginResponse> {
    return new Promise(async (resolve, reject) => {
      const partition = Date.now().toString();
      const mainWindow = new BrowserWindow({
        width: 1300,
        height: 600,
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: false,
          partition,
        },
      });
      await mainWindow.loadURL(
        'https://passport.kuaishou.com/pc/account/login/?sid=kuaishou.web.cp.api&callback=https%3A%2F%2Fcp.kuaishou.com%2Frest%2Finfra%2Fsts%3FfollowUrl%3Dhttps%253A%252F%252Fcp.kuaishou.com%252Fprofile%26setRootDomain%3Dtrue',
      );

      // 监听 URL 跳转（导航）事件
      mainWindow.webContents.on('did-navigate', async () => {
        const cookies = await mainWindow.webContents.session.cookies.get({
          url: 'https://id.kuaishou.com/pass/kuaishou/login/passToken?sid=kuaishou.web.cp.api',
        });
        // 存在关键cookie
        if (cookies.some((v) => v.name === 'passToken')) {
          const userInfoReq = await this.getAccountInfo(cookies);
          if (userInfoReq.status === 200 && userInfoReq.data.data) {
            mainWindow.close();
            resolve({
              cookies,
              userInfo: userInfoReq,
            });
          } else {
            reject('获取用户信息失败');
          }
        }
      });
    });
  }

  // 获取账户的粉丝数、关注、获赞
  async getHomeInfo(cookie: Electron.Cookie[]) {
    return await this.requestApi<IGetHomeInfoResponse>({
      cookie: cookie,
      url: '/rest/cp/creator/pc/home/infoV2',
      method: 'POST',
    });
  }

  // 获取账号信息
  async getAccountInfo(cookie: Electron.Cookie[]) {
    return await this.requestApi<IKwaiUserInfoResponse>({
      cookie: cookie,
      url: '/rest/v2/creator/pc/authority/account/current',
      method: 'POST',
    });
  }

  // 获取话题
  async getTopics({
    keyword,
    cookies,
  }: {
    keyword: string;
    cookies: Electron.Cookie[];
  }) {
    return await this.requestApi<IKwaiGetTopicsResponse>({
      cookie: cookies,
      url: `/rest/cp/works/v2/video/pc/tag/search`,
      method: 'POST',
      body: {
        keyword,
      },
    });
  }

  // 获取关注用户
  async getUsers({
    page,
    cookies,
  }: {
    page: number;
    cookies: Electron.Cookie[];
  }) {
    return await this.requestApi<IKwaiGetUsersResponse>({
      cookie: cookies,
      url: `/rest/cp/works/v2/video/pc/at/list`,
      method: 'POST',
      body: {
        atType: 3,
        pageCount: page,
        pageSize: 10,
      },
    });
  }

  // 获取快手位置
  async getLocations({
    cookies,
    cityName,
    keyword,
  }: {
    cookies: Electron.Cookie[];
    cityName: string;
    keyword: string;
  }) {
    return await this.requestApi<IKwaiGetLocationsResponse>({
      cookie: cookies,
      url: `/rest/zt/location/wi/poi/search?kpn=kuaishou_cp&subBiz=CP%2FCREATOR_PLATFORM&kuaishou.web.cp.api_ph=fe283c2f058ddb7a3098f89511fbd536dd82`,
      method: 'POST',
      body: {
        cityName,
        count: 50,
        keyword,
        pcursor: '',
      },
    });
  }

  /**
   * 获取作品列表
   * @param cookies
   * @param pcursor
   * @returns
   */
  async getPhotoList(
    cookies: Electron.Cookie[],
    pcursor?: number, // 下一页页码
  ) {
    const res = await this.requestApi<GetPhotoListResponse>({
      cookie: cookies,
      url: `/rest/cp/creator/comment/photoList`,
      method: 'POST',
      body: {
        ...(pcursor ? { pcursor } : {}),
      },
    });
    return res;
  }

  // 获取评论列表
  async getCommentList(
    cookies: Electron.Cookie[],
    photoId: string,
    pcursor?: number,
  ) {
    return await this.requestApi<GetCommentListResponse>({
      cookie: cookies,
      url: `/rest/cp/creator/comment/commentList`,
      method: 'POST',
      body: {
        photoId,
        sortType: '',
        selectedComment: false,
        ...(pcursor ? { pcursor } : {}),
      },
    });
  }

  // 获取评论的回复列表
  async getSubCommentList(
    cookies: Electron.Cookie[],
    photoId: string,
    commentId: number,
  ) {
    const res = await this.requestApi<GetSubCommentListResponse>({
      cookie: cookies,
      url: `/rest/cp/creator/comment/subCommentList`,
      method: 'POST',
      body: {
        commentId, // 969549966791,
        photoId, //'3xsq95w5uxvjx7q',
      },
    });

    return res;
  }

  /**
   * 添加评论和回复评论
   * @param cookie
   * @param photoId
   * @param content
   * @param reply
   * @returns
   */
  async commentAdd(
    cookie: Electron.Cookie[],
    photoId: string,
    content: string,
    reply: {
      replyToCommentId?: number; // 969549966791;
      replyTo?: number; // 798319351;
    },
  ) {
    const res = await this.requestApi<CommentAddResponse>({
      cookie: cookie,
      url: '/rest/cp/creator/comment/add',
      method: 'POST',
      body: {
        content,
        photoId,
        ...reply,
      },
    });

    console.log('---- douyin commentAdd ----', res);

    return res;
  }
}

export const kwaiPub = new KwaiPub();
