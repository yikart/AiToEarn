import { useUserStore } from '@/store/user';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import styles from './layoutBody.module.scss';
import { useAccountStore } from '../store/account';

export const LayoutBody = () => {
  const userStore = useUserStore();

  useEffect(() => {
    if (userStore.token) {
      userStore.getUserInfo();
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
