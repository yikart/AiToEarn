/*
 * @Author: nevin
 * @Date: 2025-02-07 20:00:47
 * @LastEditTime: 2025-03-19 14:27:53
 * @LastEditors: nevin
 * @Description:
 */
import { VideoModel } from '../../../db/models/video';
import { AccountModel } from '../../../db/models/account';
import { PubItemBase } from './PubItemBase';
import { PlatformBase } from '../PlatformBase';
import { PubStatus } from '../../../db/models/pubRecord';
import { EtEvent } from '../../../global/event';
import windowOperate from '../../../util/windowOperate';
import { SendChannelEnum } from '../../../../commont/UtilsEnum';

// 视频发布进度返回值
export interface PublishProgressRes {
  // 为 -1 表示失败
  progress: number;
  msg: string;
  account: AccountModel;
}

/**
 * 视频发布单条处理逻辑
 */
export class PubItemVideo extends PubItemBase {
  videoModel: VideoModel;

  constructor(
    accountModel: AccountModel,
    videoModel: VideoModel,
    platform: PlatformBase,
  ) {
    super(accountModel, platform);
    this.videoModel = videoModel;
  }

  /**
   * 发布视频
   */
  async publishVideo() {
    const publishVideoResult = await this.platform.videoPublish(
      {
        ...this.videoModel,
        cookies: JSON.parse(this.accountModel.loginCookie),
      },
      (progress: number, msg?: string) => {
        const args: PublishProgressRes = {
          progress,
          msg: msg || '',
          account: this.accountModel,
        };
        // 视频发布进度，向渲染层发送进度
        windowOperate.sendRenderMsg(SendChannelEnum.VideoPublishProgress, args);
      },
    );
    // 发布失败
    if (publishVideoResult.code === 0) {
      this.videoModel.status = PubStatus.FAIL;
      this.videoModel.failMsg = publishVideoResult.msg.toString();
      windowOperate.sendRenderMsg(SendChannelEnum.VideoPublishProgress, {
        progress: -1,
        msg: '发布失败！',
        account: this.accountModel,
      });
    } else {
      // 发布成功
      if (typeof publishVideoResult.pubStatus === 'number') {
        this.videoModel.status = publishVideoResult.pubStatus;
      } else {
        this.videoModel.status = PubStatus.RELEASED;
      }
      this.videoModel.dataId = publishVideoResult.dataId;
      this.videoModel.previewVideoLink = publishVideoResult.previewVideoLink;
      windowOperate.sendRenderMsg(SendChannelEnum.VideoPublishProgress, {
        progress: 100,
        msg: '发布成功！',
        account: this.accountModel,
      });
    }
    await this.uploadRecord();
    return publishVideoResult;
  }

  /**
   * 更新视频记录
   */
  async uploadRecord() {
    EtEvent.emit('ET_PUBLISH_UPDATE_VIDEO_PUL', this.videoModel);
  }
}
