import styles from '../../aiTool.module.scss';
import WebView from '../../../../components/WebView';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Page() {
  const location = useLocation();
  const searchParams = useSearchParams();
  const [webviewUrl, setWebviewUrl] = useState('');

  useEffect(() => {
    setWebviewUrl(searchParams[0].get('webviewUrl') || '');
    console.log(searchParams[0].get('webviewUrl'));
  }, [location]);

  return (
    <div className={styles['aiTool-webview']}>
      <WebView
        url={webviewUrl}
        key={webviewUrl}
        allowpopups
        partition={'aiTools'}
      />
    </div>
  );
}
