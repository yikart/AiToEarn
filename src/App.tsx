/*
 * @Author: nevin
 * @Date: 2025-01-17 19:25:29
 * @LastEditTime: 2025-03-23 15:00:16
 * @LastEditors: nevin
 * @Description: 主应用
 */

import { RouterProvider } from 'react-router-dom';
import router from '@/router/index';
import { ConfigProvider, notification } from 'antd';
import Inform from './components/Inform';
import { useEffect } from 'react';
import { useAccountStore } from './store/commont';

const App = () => {
  const [api, contextHolder] = notification.useNotification({
    top: 70,
  });

  useEffect(() => {
    useAccountStore.getState().setNotification(api);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#a66ae4',
        },
      }}
    >
      {contextHolder}
      <Inform onChooseItem={() => {}} />
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

export default App;
