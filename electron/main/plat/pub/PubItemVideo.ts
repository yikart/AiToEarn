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
import { VisibleTypeEnum } from '../../../../commont/publish/PublishEnum';
import windowOperate from '../../../util/windowOperate';
import { SendChannelEnum } from '../../../../commont/UtilsEnum';

// 视频发布进度返回值
export interface VideoPublishProgressRes {
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
        desc: this.videoModel.desc!,
        videoPath: this.videoModel.videoPath!,
        title: this.videoModel.title || '',
        topics: this.videoModel.topics || [],
        coverPath: this.videoModel.coverPath || '',
        visibleType: this.videoModel.visibleType || VisibleTypeEnum.Private,
        diffParams: this.videoModel.diffParams || {},
        timingTime: this.videoModel.timingTime,
        location: this.videoModel.location,
      },
      (progress: number, msg?: string) => {
        const args: VideoPublishProgressRes = {
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
      this.videoModel.failMsg = publishVideoResult.msg;
    } else {
      // 发布成功
      this.videoModel.status = PubStatus.RELEASED;
      this.videoModel.dataId = publishVideoResult.dataId;
      this.videoModel.previewVideoLink = publishVideoResult.previewVideoLink;
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
