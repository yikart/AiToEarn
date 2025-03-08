import { useState } from 'react';
import styles from '../login.module.scss';
import PhoneLogin from './PhoneLogin';
import QrcodeLogin from './qrcodeLogin';
import { WechatOutlined, MobileOutlined } from '@ant-design/icons';

export const LoginCore = () => {
  const [loginType, setLoginType] = useState<'phone' | 'qrcode'>('phone');

  return (
    <div className={styles.loginCore} style={{ position: 'relative' }}>
      <div className={styles.switch_login_type}>
        {loginType === 'phone' ? (
          <WechatOutlined
            className={styles.switch_icon}
            onClick={() => setLoginType('qrcode')}
          />
        ) : (
          <MobileOutlined
            className={styles.switch_icon}
            onClick={() => setLoginType('phone')}
          />
        )}
      </div>

      <div className={styles.login_content}>
        {loginType === 'phone' ? <PhoneLogin /> : <QrcodeLogin />}
      </div>
    </div>
  );
};
