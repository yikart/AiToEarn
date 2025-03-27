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
import { AccountInfo } from '../../views/account/comment';
import { AccountType } from '../../../commont/AccountEnum';

export interface IWebViewRef {}

export interface IWebViewProps {
  url: string;
  cookieParams?: ICookieParams;
  // 是否开启沙盒化模式
  partition?: boolean;
  account?: AccountInfo;
}

const WebView = memo(
  forwardRef(
    (
      { url, cookieParams, partition, account }: IWebViewProps,
      ref: ForwardedRef<IWebViewRef>,
    ) => {
      const webviewRef = useRef<HTMLWebViewElement>(null);
      // webView id
      const [webViewId, setWebViewId] = useState(-1);
      const [loading, setLoading] = useState(true);
      // 隔离ID
      const partitionId = useRef(generateUUID());

      useEffect(() => {
        console.log(cookieParams);
        setLoading(true);

        webviewRef.current?.addEventListener('dom-ready', async () => {
          // 每个平台localStorage添加
          if (account) {
            let jsCode;
            if (account?.type === AccountType.Douyin) {
              jsCode = `
                localStorage.setItem('douyin_web_hide_guide', '1');
                localStorage.setItem('user_info', '{"uid":"${account.account}","nickname":"${account.nickname}","avatarUrl":"${account.avatar}"}');
                localStorage.setItem('useShortcut2', '{"Wed Mar 12 2025":false}');
              `;
            }
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
                src={loading ? 'about:blank' : url}
                style={{ width: '100%', height: '100%' }}
                partition={partition ? partitionId.current : undefined}
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
