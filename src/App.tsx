/*
 * @Author: nevin
 * @Date: 2025-01-17 19:25:29
 * @LastEditTime: 2025-03-23 15:00:16
 * @LastEditors: nevin
 * @Description: 主应用
 */

import { RouterProvider } from 'react-router-dom';
import router from '@/router/index';
import { ConfigProvider } from 'antd';
import Inform from './components/Inform';

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#a66ae4',
        },
      }}
    >
      <Inform onChooseItem={() => {}} />
      <RouterProvider router={router} />
    </ConfigProvider>
  );
};

export default App;
