import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider } from 'antd';
import zh_CN from 'antd/es/locale/zh_CN';

import './index.scss';
import './var.css';

import { generate } from '@ant-design/colors';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    {(() => {
      const colors = generate('#a66ae4');
      const root = document.documentElement;
      for (let i = 0; i < colors.length; i++) {
        /**
         * 主题色：
         * --colorPrimary1  ~~  --colorPrimary10
         * 由浅到深
         */
        root.style.setProperty(`--colorPrimary${i + 1}`, colors[i]);
      }

      return (
        <ConfigProvider
          locale={zh_CN}
          theme={{
            token: {
              colorPrimary: colors[5].trim(),
            },
          }}
        >
          <App />
        </ConfigProvider>
      );
    })()}
  </>,
);

postMessage({ payload: 'removeLoading' }, '*');
