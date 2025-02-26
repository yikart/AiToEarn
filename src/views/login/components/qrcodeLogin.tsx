/*
 * @Author: nevin
 * @Date: 2025-02-17 19:28:13
 * @LastEditTime: 2025-02-26 09:09:32
 * @LastEditors: nevin
 * @Description: 微信二维码登录
 */
import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { userApi } from '@/api/user';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from '../login.module.scss';

export interface PubItemRef {
  init: (pubRecord: any) => Promise<void>;
}

export default forwardRef<PubItemRef>((props, ref) => {
  const [ticketInfo, setTicketInfo] = useState<{ ticket: string; key: string }>({
    ticket: '',
    key: '',
  });
  const [showMask, setShowMask] = useState(false);

  useEffect(() => {
    getQrcode();
    const timer = setTimeout(() => {
      setShowMask(true);
    }, 30000); // 30秒后显示遮罩

    return () => {
      clearTimeout(timer);
    };
  }, []);

  async function getQrcode() {
    const res = await userApi.getWxLoginQrcode({});
    if (res) {
      setTicketInfo({
        ticket: res.ticket,
        key: res.key,
      });
      setShowMask(false);
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
    init: async (info: any) => {},
  }));

  return (
    <div className={styles.qrcodeLogin}>
      <div className={styles.qrcodeHeader}>
        <h2>微信扫码登录</h2>
        <p>请使用微信扫描二维码关注爱团团公众号</p>
      </div>
      
      <div className={styles.qrcodeWrapper}>
        {ticketInfo.ticket && (
          <img
            src={`https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${ticketInfo.ticket}`}
            alt="微信登录二维码"
          />
        )}
        
        {showMask && (
          <div className={styles.qrcodeMask}>
            <p>二维码已过期</p>
            <Button 
              type="link" 
              icon={<ReloadOutlined />} 
              onClick={getQrcode}
              className={styles.refreshBtn}
            >
              刷新二维码
            </Button>
          </div>
        )}
      </div>

      <div className={styles['loginForm-buttonWrapper']}>
        <Button 
          onClick={wxGzhQrcodelogin}
          className={`${styles.submitBtn} ${ticketInfo.ticket ? styles.active : ''}`}
        >
          登录
        </Button>
      </div>
    </div>
  );
});
