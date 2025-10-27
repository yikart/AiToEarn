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

  // 查询用户信息
  const queryUserInfo = async () => {
    let count = 0;
    while (true) {
      const res = await userStore.getUserInfo().catch(() => false);
      if (res || count >= 10) break;
      await sleep(1000);
      count++;
    }
  };

  useEffect(() => {
    useBellMessageStroe.getState().videoPublishProgressInit();
    if (userStore.token) {
      queryUserInfo();
    } else {
      userStore.logout();
    }
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
    if (userStore.token) {
      useAccountStore.getState().init();
    } else {
      useAccountStore.getState().clear();
    }
  }, [userStore.token]);

  if (!userStore.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.layoutBody}>
      <Navigation />
      <main className="layoutBody-main">
        <Outlet />
      </main>
    </div>
  );
};
