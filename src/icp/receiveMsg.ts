// 接收主进程发来的消息
import { SendChannelEnum } from '../../commont/UtilsEnum';
import { PublishProgressRes } from '../../electron/main/plat/pub/PubItemVideo';
import IpcRendererEvent = Electron.IpcRendererEvent;
import { AccountModel } from '../../electron/db/models/account';
import { PlatType } from '@@/AccountEnum';

// 绑定事件中间层方法
const bindEventCore = (
  channel: SendChannelEnum,
  listener: (event: IpcRendererEvent, ...args: any[]) => void,
): (() => void) => {
  const e = window.ipcRenderer.on(channel, listener);
  // @ts-ignore
  const events: any[] = e._events[channel];
  if (!events) return () => {};
  let f: any;
  if (events instanceof Array) {
    f = events[events.length === 0 ? 0 : events.length - 1];
  } else {
    f = events;
  }
  return () => {
    if (f) {
      window.ipcRenderer.off(channel, f);
    }
  };
};

// ----------------------- 应用 ---------------------------

export const onInteractionProgress = (callback: (...args: any[]) => void) => {
  return bindEventCore(SendChannelEnum.InteractionProgress, (e, ...args) => {
    callback(...args);
  });
};

/**
 * 账户登录完成的事件，可能为多个账户更新后的结果
 * @param callback account=如果为多个账户更新的结果那么这个值是第一个，主要是为了兼容之前的单个账户的检测，accounts=如果是单个检测这个值为空，多个值检测这个值为更新后的账号结果
 */
export const onAccountLoginFinish = (
  callback: (account: AccountModel, accounts?: PlatType[]) => void,
) => {
  return bindEventCore(
    SendChannelEnum.AccountLoginFinish,
    (e, account: AccountModel, accounts?: PlatType[]) => {
      callback(account, accounts);
    },
  );
};

// 视频审核完成
export const onVideoAuditFinish = (
  callback: (_: { previewVideoLink: string; dataId: string }) => void,
) => {
  return bindEventCore(SendChannelEnum.VideoAuditFinish, (_, ...args) => {
    // @ts-ignore
    callback(...args);
  });
};

// 视频发布进度
export const onVideoPublishProgress = (
  callback: (progressData: PublishProgressRes, id: number) => void,
) => {
  return bindEventCore(
    SendChannelEnum.VideoPublishProgress,
    (_, progressData, id) => {
      callback(progressData, id);
    },
  );
};

// 图文发布进度
export const onImgTextPublishProgress = (
  callback: (progressData: PublishProgressRes) => void,
) => {
  return bindEventCore(
    SendChannelEnum.ImgTextPublishProgress,
    (_, progressData) => {
      callback(progressData);
    },
  );
};
