/*
 * @Author: nevin
 * @Date: 2025-02-17 19:28:13
 * @LastEditTime: 2025-02-26 09:09:32
 * @LastEditors: nevin
 * @Description: 微信二维码登录
 */
import { forwardRef, useImperativeHandle, useState } from 'react';
import { userApi } from '@/api/user';
import { Button } from 'antd';
export interface PubItemRef {
  init: (pubRecord: any) => Promise<void>;
}

export default forwardRef<PubItemRef>((props, ref) => {
  const [ticketInfo, setTicketInfo] = useState<{ ticket: string; key: string }>(
    {
      ticket: '',
      key: '',
    },
  );

  async function init(info: any) {}

  async function getQrcode() {
    const res = await userApi.getWxLoginQrcode({});
    console.log('---- res', res);
    if (res) {
      setTicketInfo({
        ticket: res.ticket,
        key: res.key,
      });
    }
  }

  /**
   * 登录
   */
  async function wxGzhQrcodelogin() {
    const res = await userApi.wxGzhQrcodelogin(ticketInfo);
    console.log('---- res', res);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  return (
    <div>
      <Button onClick={getQrcode}>获取二维码</Button>
      <Button onClick={wxGzhQrcodelogin}>登录</Button>
      {ticketInfo.ticket && (
        <img
          src={`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticketInfo.ticket}`}
          alt="微信登录二维码"
        />
      )}
    </div>
  );
});
