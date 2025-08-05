import { useUserStore } from '@/store/user';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import styles from './layoutBody.module.scss';
import { useAccountStore } from '../store/account';
import { sleep } from '../../commont/utils';
import { useBellMessageStroe } from '../store/bellMessageStroe';

export const LayoutBody = () => {
  const userStore = useUserStore();

  // 免登录初始化
  const initWithoutLogin = async () => {
    // 设置免登录状态
    userStore.setToken({ token: 'no-login-required', exp: Date.now() + 86400000 });
    userStore.getUserInfo({
      uid: 'guest',
      username: '免登录用户',
      email: '',
      mobile: '',
      avatar: '',
      status: 1,
    } as any);
  };

  useEffect(() => {
    useBellMessageStroe.getState().videoPublishProgressInit();
    // 直接初始化，无需登录
    initWithoutLogin();
  }, []);

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'KeyI') {
        event.preventDefault();
        window.ipcRenderer.invoke('OPEN_DEV_TOOLS', 'right');
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // 始终初始化账户状态
    useAccountStore.getState().init();
  }, [userStore.token]);

  return (
    <div className={styles.layoutBody}>
      <Navigation />
      <main className="layoutBody-main">
        <Outlet />
      </main>
    </div>
  );
};
