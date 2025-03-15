import React, { useState, useEffect } from 'react';
import styles from './errorBoundary.module.scss';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleError = (error: Error) => {
    setErrorMsg(error.stack || '');
    setHasError(true);
  };

  useEffect(() => {
    const errorListener = (event: ErrorEvent) => {
      handleError(event.error);
    };

    window.addEventListener('error', errorListener);

    return () => {
      window.removeEventListener('error', errorListener);
    };
  }, []);

  if (hasError) {
    // 您可以自定义回退UI
    return (
      <div className={styles.errorBoundary}>
        <h1>对不起，系统出现了错误</h1>
        <Button
          type="primary"
          onClick={() => {
            console.log(errorMsg);
            console.log('错误上报');
            navigate('/login');
          }}
        >
          上报错误
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary;
