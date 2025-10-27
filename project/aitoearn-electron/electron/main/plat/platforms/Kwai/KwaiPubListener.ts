import { kwaiPub } from '../../../../plat/Kwai';
import { EtEvent } from '../../../../global/event';
import windowOperate from '../../../../util/windowOperate';
import { SendChannelEnum } from '../../../../../commont/UtilsEnum';
import { sleep } from '../../../../../commont/utils';
import { VideoModel } from '../../../../db/models/video';
import { AccountModel } from '../../../../db/models/account';
import { PubStatus } from '../../../../../commont/publish/PublishEnum';

/**
 * 快手发布监听器
 * 快手发布视频后会调用这个静态类的方法监听该条发布的视频是否完成，如果完成那么不会再监听
 */
export default class KwaiPubListener {
  private constructor() {}

  // 是否已经开始启动，防止重复启动
  static started = false;
  // key=cookie，val=侦听的id
  static listenMap: Map<string, number[]> = new Map();

  // 处理逻辑
  static async handle(cookie: string) {
    const ids = KwaiPubListener.listenMap.get(cookie)!;
    const works = await kwaiPub.refreshWorks(JSON.parse(cookie), ids);
    works.data.data.list.find((v) => {
      if (v.workId) {
        const previewVideoLink = `https://www.kuaishou.com/short-video/${v.workId}`;
        EtEvent.emit('ET_PUBLISH_UPDATE_VIDEO_PUL_BY_DATAID', {
          previewVideoLink,
          status: PubStatus.RELEASED,
          dataId: `${v.id}`,
        });
        windowOperate.sendRenderMsg(SendChannelEnum.VideoAuditFinish, {
          previewVideoLink,
          dataId: v.id,
        });
        const newIds = ids.filter((id) => id != v.id);
        if (newIds.length === 0) {
          KwaiPubListener.listenMap.delete(cookie);
        } else {
          KwaiPubListener.listenMap.set(cookie, newIds);
        }
      }
    });
  }

  static async getVideoRecord() {
    return new Promise<VideoModel[]>((resolve) => {
      EtEvent.emit('ET_PUBLISH_VIDEO_AUDIT_LIST', (list: VideoModel[]) => {
        resolve(list);
      });
    });
  }

  static async getAccountById(ids: number[]) {
    return new Promise<AccountModel[]>((resolve) => {
      EtEvent.emit(
        'ET_ACCOUNT_GET_LIST_BY_IDS',
        ids,
        (list: AccountModel[]) => {
          resolve(list);
        },
      );
    });
  }

  /**
   * 开始监听
   */
  static async start(cookie?: string, id?: number) {
    if (cookie) {
      if (!KwaiPubListener.listenMap.has(cookie)) {
        KwaiPubListener.listenMap.set(cookie, []);
      }
      KwaiPubListener.listenMap.get(cookie)?.push(id!);
    } else {
      const videoModels: VideoModel[] = await KwaiPubListener.getVideoRecord();
      if (videoModels && videoModels.length === 0) return;
      const accountIds = videoModels.map((v) => {
        return v.accountId;
      });
      if (accountIds.length === 0) return;
      const accounts: AccountModel[] =
        await KwaiPubListener.getAccountById(accountIds);
      if (accounts.length === 0) return;

      accounts.map((v) => {
        const cookie = v.loginCookie;
        if (!KwaiPubListener.listenMap.has(cookie)) {
          KwaiPubListener.listenMap.set(
            cookie,
            videoModels
              .filter((k) => k.accountId === v.id)
              .map((v) => {
                return parseInt(<string>v.dataId);
              }),
          );
        }
      });
    }
    if (KwaiPubListener.started) return;

    KwaiPubListener.started = true;
    while (true) {
      if (KwaiPubListener.listenMap.size === 0) {
        break;
      }
      try {
        const tasks: Promise<void>[] = [];
        for (const [cookie] of KwaiPubListener.listenMap) {
          tasks.push(this.handle(cookie));
        }
        await Promise.all(tasks);
      } catch (e) {
        console.error('快手审核作品查询错误：', e);
        break;
      }
      await sleep(3000);
    }
    KwaiPubListener.started = false;
  }
}
