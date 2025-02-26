/*
 * @Author: nevin
 * @Date: 2025-01-17 19:25:29
 * @LastEditTime: 2025-01-23 15:41:13
 * @LastEditors: nevin
 * @Description: 主应用
 */

import { RouterProvider } from 'react-router-dom';
import router from '@/router/index';

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
