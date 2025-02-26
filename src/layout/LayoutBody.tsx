import { useUserStore } from '@/store/user';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export const LayoutBody = () => {
  const userStore = useUserStore();

  useEffect(() => {
    userStore.getUserInfo();
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

  if (!userStore.token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-full" style={{ height: '100%' }}>
      <Navigation />
      <main style={{ height: '100%', minHeight: 0, width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};
