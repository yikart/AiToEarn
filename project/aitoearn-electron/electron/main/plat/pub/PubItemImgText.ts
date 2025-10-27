/*
 * @Author: nevin
 * @Date: 2025-02-07 20:00:47
 * @LastEditTime: 2025-04-24 14:30:42
 * @LastEditors: nevin
 * @Description:
 */
import { AccountModel } from '../../../db/models/account';
import { PubItemBase } from './PubItemBase';
import { PlatformBase } from '../PlatformBase';
import { ImgTextModel } from '../../../db/models/imgText';
import { EtEvent } from '../../../global/event';
import { PublishProgressRes } from './PubItemVideo';
import windowOperate from '../../../util/windowOperate';
import { SendChannelEnum } from '../../../../commont/UtilsEnum';
import { PubStatus } from '../../../../commont/publish/PublishEnum';

/**
 * 视频发布单条处理逻辑
 */
export class PubItemImgText extends PubItemBase {
  imgTextModel: ImgTextModel;

  constructor(
    accountModel: AccountModel,
    imgTextModel: ImgTextModel,
    platform: PlatformBase,
  ) {
    super(accountModel, platform);
    this.imgTextModel = imgTextModel;
  }

  async publishImgText() {
    const params: ImgTextModel = {
      ...this.imgTextModel,
      cookies: JSON.parse(this.accountModel.loginCookie),
      token: this.accountModel.token,
    };
    console.log('图文发布原始参数：', params);
    const publishVideoResult = await this.platform.imgTextPublish(params);
    // 发布失败
    if (publishVideoResult.code === 0) {
      this.imgTextModel.status = PubStatus.FAIL;
      this.imgTextModel.failMsg = publishVideoResult.msg.toString();
    } else {
      // 发布成功
      this.imgTextModel.status = PubStatus.RELEASED;
      this.imgTextModel.dataId = publishVideoResult.dataId;
      this.imgTextModel.previewVideoLink = publishVideoResult.previewVideoLink;
    }
    // 发布进度
    const progressRes: PublishProgressRes = {
      id: 1,
      progress: publishVideoResult.code === 0 ? -1 : 100,
      msg: '',
      account: this.accountModel,
    };
    // 图文发布进度，向渲染层发送进度
    windowOperate.sendRenderMsg(
      SendChannelEnum.ImgTextPublishProgress,
      progressRes,
    );
    await this.uploadRecord();
    return publishVideoResult;
  }

  /**
   * 更新图文记录
   */
  async uploadRecord() {
    this.imgTextModel.proxyIp = undefined;
    EtEvent.emit('ET_PUBLISH_UPDATE_IMG_TEXT_PUL', this.imgTextModel);
  }
}
