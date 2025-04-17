import styles from '../../aiTool.module.scss';
import WebView from '../../../../components/WebView';

export default function Page() {
  return (
    <div className={styles['aiTool-webview']}>
      <WebView url="https://www.yikart.cn/chat?isHideNav=true" />
    </div>
  );
}
