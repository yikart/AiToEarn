import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider, theme } from 'antd';
import zh_CN from 'antd/es/locale/zh_CN';
import 'virtual:svg-icons-register';

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
         * 注意：“--colorPrimary6” 为中间主题色，不是 “5”
         */
        root.style.setProperty(`--colorPrimary${i + 1}`, colors[i]);
      }

      return (
        <ConfigProvider
          locale={zh_CN}
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: '#667eea',
              colorBgBase: '#0f0f0f',
              colorBgContainer: '#1a1a1a',
              colorBgElevated: '#262626',
              colorBorder: '#333333',
              colorBorderSecondary: '#555555',
              colorText: '#ffffff',
              colorTextSecondary: '#d9d9d9',
              colorTextTertiary: '#8c8c8c',
              colorTextQuaternary: '#595959',
              borderRadius: 8,
              boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            },
            components: {
              Card: {
                colorBgContainer: '#1a1a1a',
                colorBorder: '#333333',
              },
              Input: {
                colorBgContainer: '#262626',
                colorBorder: '#333333',
                colorText: '#ffffff',
              },
              Button: {
                primaryShadow: '0 2px 0 rgba(102, 126, 234, 0.1)',
              },
              Progress: {
                defaultColor: '#667eea',
              },
              Tabs: {
                colorBgContainer: '#1a1a1a',
                colorBorder: '#333333',
              },
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
