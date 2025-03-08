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
import { useUserStore } from '@/store/user';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';

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
  const [showMask, setShowMask] = useState(false);
  const userStore = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    getQrcode();
    const qrcodeTimer = setTimeout(() => {
      setShowMask(true);
    }, 30000); // 30秒后显示遮罩

    return () => {
      clearTimeout(qrcodeTimer);
    };
  }, []);

  // 添加轮询登录检查
  useEffect(() => {
    let loginTimer: NodeJS.Timeout;

    if (ticketInfo.ticket) {
      loginTimer = setInterval(async () => {
        const res = await userApi.wxGzhQrcodelogin(ticketInfo);
        if (res.token !== '' && res.userInfo) {
          LoginSuccess(res);
          clearInterval(loginTimer);
        }
      }, 2000); // 每2秒检查一次
    }

    return () => {
      if (loginTimer) {
        clearInterval(loginTimer);
      }
    };
  }, [ticketInfo]);

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

  const LoginSuccess = (res: any) => {
    if (!res) return;
    window.ipcRenderer.invoke('ICP_USER_ADD', res.userInfo);
    userStore.setToken(res);
    userStore.getUserInfo(res.userInfo);
    message.success('登录成功！');
    navigate('/');
  };

  /**
   * 登录
   */
  async function wxGzhQrcodelogin() {
    const res = await userApi.wxGzhQrcodelogin(ticketInfo);
    console.log('---- res', res);
    if (res.token !== '' && res.userInfo) {
      LoginSuccess(res);
    }
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

      <div className={styles.agreement}>
        登录即表示已接受爱团团
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault(); /* 打开注册协议 */
          }}
        >
          《注册协议》
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault(); /* 打开隐私政策 */
          }}
        >
          《隐私权政策》
        </a>
      </div>
    </div>
  );
});
