import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react';
import { generateUUID } from '../../utils';
import styles from './webView.module.scss';
import { Spin } from 'antd';
import { ICookieParams } from '../../../electron/main/account/BrowserWindow/browserWindow';

export interface IWebViewRef {}

export interface IWebViewProps {
  url: string;
  cookieParams?: ICookieParams;
  jsCode?: string;
}

const WebView = memo(
  forwardRef(
    (
      { url, cookieParams, jsCode }: IWebViewProps,
      ref: ForwardedRef<IWebViewRef>,
    ) => {
      const webviewRef = useRef<HTMLWebViewElement>(null);
      // webView id
      const [webViewId, setWebViewId] = useState(-1);
      const [loading, setLoading] = useState(true);
      // 隔离ID
      const partitionId = useRef(generateUUID());

      useEffect(() => {
        setLoading(true);
        webviewRef.current?.addEventListener('dom-ready', async () => {
          if (jsCode) {
            // @ts-ignore
            webviewRef.current!.executeJavaScript(jsCode);
          }

          // @ts-ignore
          if (webviewRef.current?.getURL() === 'about:blank') {
            // @ts-ignore
            const id = webviewRef.current!.getWebContentsId();
            setWebViewId(id);

            // @ts-ignore
            await window.ipcRenderer.invoke('ICP_ACCOUNT_CREATE_BROWSER_VIEW', {
              webViewId: id,
              cookieParams,
            });
          }
          setLoading(false);
        });

        return () => {
          window.ipcRenderer.invoke(
            'ICP_ACCOUNT_DESTROY_BROWSER_VIEW',
            webViewId,
          );
        };
      }, []);

      return (
        url && (
          <div className={styles.webview}>
            <Spin spinning={loading} tip="加载中...">
              <webview
                ref={webviewRef}
                webpreferences="sandbox"
                src={!jsCode ? (loading ? 'about:blank' : url) : url}
                style={{ width: '100%', height: '100%' }}
                partition={partitionId.current}
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0"
              ></webview>
            </Spin>
          </div>
        )
      );
    },
  ),
);
WebView.displayName = 'WebView';

export default WebView;
