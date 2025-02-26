// 接收主进程发来的消息
import { SendChannelEnum } from '../../commont/UtilsEnum';

// 账户登录完成
export const onAccountLoginFinish = (callback: () => void) => {
  window.ipcRenderer.on(SendChannelEnum.AccountLoginFinish, () => {
    callback();
  });
};
