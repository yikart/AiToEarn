// 接收主进程发来的消息
import { SendChannelEnum } from '../../commont/UtilsEnum';
import { VideoPublishProgressRes } from '../../electron/main/plat/pub/PubItemVideo';

// 账户登录完成
export const onAccountLoginFinish = (callback: () => void) => {
  window.ipcRenderer.on(SendChannelEnum.AccountLoginFinish, () => {
    callback();
  });
};

// 视频发布进度
export const onVideoPublishProgress = (
  callback: (progressData: VideoPublishProgressRes) => void,
) => {
  window.ipcRenderer.on(
    SendChannelEnum.VideoPublishProgress,
    (_event, progressData) => {
      callback(progressData);
    },
  );
};
