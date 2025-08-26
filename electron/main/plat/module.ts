/*
 * @Author: nevin
 * @Date: 2025-02-07 09:48:29
 * @LastEditTime: 2025-02-08 20:13:55
 * @LastEditors: nevin
 * @Description:
 */
import { PlatType } from '../../../commont/AccountEnum';

import { PubStatus } from '../../../commont/publish/PublishEnum';

interface IProperty {
  code: number;
  msg: string;
  dataId: string;
  previewVideoLink: string;
}

export interface IVideoPubOtherData {
  [PlatType.Xhs]?: {
    // 预览需要
    xsec_token: string;
    xsec_source: string;
  };
}

export class PublishVideoResult {
  // 0=失败 1=成功
  code: number;
  // 提示信息
  msg: string;
  // 数据ID
  dataId?: string;
  // 预览视频地址
  previewVideoLink?: string;
  // 发布状态，可选值
  pubStatus?: PubStatus;

  constructor(
    { code, msg, dataId, previewVideoLink }: IProperty = {
      code: 1,
      msg: '发布成功！',
      dataId: '',
      previewVideoLink: '',
    },
  ) {
    this.code = code;
    this.msg = msg;
    this.dataId = dataId;
    this.previewVideoLink = previewVideoLink;
  }
}
