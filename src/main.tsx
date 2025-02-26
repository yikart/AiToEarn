import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider } from 'antd';
import zh_CN from 'antd/es/locale/zh_CN';

import './index.css';
import './var.css';

import './demos/ipc';
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zh_CN}
      theme={{
        token: {
          colorPrimary: getComputedStyle(document.documentElement)
            .getPropertyValue('--colorPrimary5')
            .trim(),
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);

postMessage({ payload: 'removeLoading' }, '*');
