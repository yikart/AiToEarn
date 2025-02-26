/*
 * @Author: nevin
 * @Date: 2025-01-17 21:02:44
 * @LastEditTime: 2025-02-11 17:43:22
 * @LastEditors: nevin
 * @Description:
 */
import { useEffect, useRef, useState } from 'react';
import { ICookieParams } from '../../../electron/main/account/BrowserWindow/browserWindow';
import styles from './webView.module.scss';
import { Spin } from 'antd';
import { generateUUID } from '@/utils';

interface WebViewProps {
  url: string;
  cookieParams?: ICookieParams;
}

const WebView: React.FC<WebViewProps> = ({ url, cookieParams }) => {
  const webviewRef = useRef<HTMLWebViewElement>(null);
  // webView id
  const [webViewId, setWebViewId] = useState(-1);
  const [loading, setLoading] = useState(true);
  // 隔离ID
  const partitionId = useRef(generateUUID());

  useEffect(() => {
    setLoading(true);
    webviewRef.current!.addEventListener('dom-ready', async () => {
      // @ts-ignore
      const id = webviewRef.current!.getWebContentsId();
      setWebViewId(id);

      console.log('---- cookieParams', cookieParams);

      await window.ipcRenderer.invoke('ICP_ACCOUNT_CREATE_BROWSER_VIEW', {
        webViewId: id,
        cookieParams,
      });
      setLoading(false);
    });

    return () => {
      window.ipcRenderer.invoke('ICP_ACCOUNT_DESTROY_BROWSER_VIEW', webViewId);
    };
  }, []);

  return (
    <div className={styles.webview}>
      <Spin spinning={loading} tip="加载中...">
        <webview
          ref={webviewRef}
          src={!loading ? url : 'www.baidu.com'}
          webpreferences="sandbox"
          style={{ width: '100%', height: '100%' }}
          partition={partitionId.current}
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0"
        ></webview>
      </Spin>
    </div>
  );
};

export default WebView;
