'use client';

import React, { useState } from 'react';
import { useTransClient } from '@/app/i18n/client';
import { Button, Input, message, Card, Upload } from 'antd';
import { MailOutlined, YoutubeOutlined, CheckOutlined, UploadOutlined } from '@ant-design/icons';
import { getYouTubeAuthUrlApi, checkYouTubeAuthApi, uploadYouTubeVideoApi } from '@/api/youtube';
import styles from './youtube.module.css';

const YouTubeAuth: React.FC = () => {
  const { t } = useTransClient('youtube');
  const [email, setEmail] = useState('zhang7676533317@gmail.com');
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleCheck = async () => {
    if (!email) {
      message.error(t('pleaseEnterEmail'));
      return;
    }

    setCheckLoading(true);
    try {
      const response = await checkYouTubeAuthApi({ accountId: "117748783778429701407"});
      
      if (response?.data) {
        message.success(t('alreadyAuthorized'));
        setIsAuthorized(true);
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
        window.open(response.data?.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('获取授权 URL 失败:', error);
      message.error(t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {

    if (!isAuthorized) {
      message.error(t('notAuthorized'));
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('accountId', "117748783778429701407");
      
      const response = await uploadYouTubeVideoApi(formData);
      if (response?.data) {
        message.success(t('uploadSuccess'));
      }
    } catch (error) {
      console.error('上传视频失败:', error);
      message.error(t('uploadFailed'));
    } finally {
      setUploadLoading(false);
    }
    return false;
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

          <div className={styles.uploadSection}>
            <Upload
              accept="video/*"
              showUploadList={false}
              beforeUpload={handleUpload}
              disabled={!isAuthorized || uploadLoading}
            >
              <Button
                type="primary"
                size="large"
                loading={uploadLoading}
                className={styles.uploadButton}
                icon={<UploadOutlined />}
                disabled={!isAuthorized}
              >
                {t('uploadVideo')}
              </Button>
            </Upload>
            {!isAuthorized && (
              <p className={styles.uploadTip}>
                {t('needAuthFirst')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default YouTubeAuth; 