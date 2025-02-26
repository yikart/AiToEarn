/*
 * @Author: nevin
 * @Date: 2025-02-07 09:48:29
 * @LastEditTime: 2025-02-08 20:13:55
 * @LastEditors: nevin
 * @Description:
 */
interface IProperty {
  code: number;
  msg: string;
  dataId: string;
}

export class PublishVideoResult {
  // 0=失败 1=成功
  code: number;
  // 提示信息
  msg: string;

  // 数据ID
  dataId: string;

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
