'use client';

import React, { useState } from 'react';
import { useTransClient } from '@/app/i18n/client';
import { Button, Input, message, Card } from 'antd';
import { MailOutlined, YoutubeOutlined, CheckOutlined } from '@ant-design/icons';
import { getYouTubeAuthUrlApi, checkYouTubeAuthApi } from '@/api/youtube';
import styles from './youtube.module.css';

const YouTubeAuth: React.FC = () => {
  const { t } = useTransClient('youtube');
  const [email, setEmail] = useState('zhang7676533317@gmail.com');
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleCheck = async () => {
    if (!email) {
      message.error(t('pleaseEnterEmail'));
      return;
    }

    setCheckLoading(true);
    try {
      const response = await checkYouTubeAuthApi(email);
      setIsAuthorized(response?.data?.authorized || false);
      if (response?.data?.authorized) {
        message.success(t('alreadyAuthorized'));
      } else {
        message.info(t('notAuthorized'));
      }
    } catch (error) {
      console.error('检查授权状态失败:', error);
      message.error(t('checkFailed'));
    } finally {
      setCheckLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email) {
      message.error(t('pleaseEnterEmail'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.error(t('invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const response = await getYouTubeAuthUrlApi(email);
      if (response?.data) {
        window.open(response.data, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('获取授权 URL 失败:', error);
      message.error(t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card 
        className={styles.card}
        bodyStyle={{ padding: '2.5rem' }}
      >
        <div className={styles.header}>
          <YoutubeOutlined className={styles.icon} />
          <h2 className={styles.title}>
            {t('youtubeAuth')}
          </h2>
          <p className={styles.description}>
            {t('authDescription')}
          </p>
        </div>

        <div className={styles.form}>
          <div className={styles.formItem}>
            <label htmlFor="email" className={styles.label}>
              {t('email')}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              size="large"
              className={styles.input}
              placeholder={t('enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              prefix={<MailOutlined className={styles.inputIcon} />}
            />
          </div>

          <div className={styles.buttonGroup}>
            <Button
              type="default"
              size="large"
              onClick={handleCheck}
              loading={checkLoading}
              className={styles.checkButton}
              icon={<CheckOutlined />}
            >
              {t('checkAuth')}
            </Button>

            <Button
              type="primary"
              size="large"
              onClick={handleAuth}
              loading={loading}
              className={styles.button}
              icon={<YoutubeOutlined />}
            >
              {t('authorize')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default YouTubeAuth; 