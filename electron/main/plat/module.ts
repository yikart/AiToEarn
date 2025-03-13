/*
 * @Author: nevin
 * @Date: 2025-02-07 09:48:29
 * @LastEditTime: 2025-02-08 20:13:55
 * @LastEditors: nevin
 * @Description:
 */
import { AccountType } from '../../../commont/AccountEnum';

interface IProperty {
  code: number;
  msg: string;
  dataId: string;
}

export interface IVideoPubOtherData {
  [AccountType.Xhs]?: {
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
  // 其它数据，发布完成每个可能需要这个平台独特的数据
  videoPubOtherData?: IVideoPubOtherData;

  constructor(
    { code, msg, dataId }: IProperty = {
      code: 1,
      msg: '发布成功！',
      dataId: '',
    },
  ) {
    this.code = code;
    this.msg = msg;
    this.dataId = dataId;
  }
}
