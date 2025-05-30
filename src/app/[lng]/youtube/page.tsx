'use client';

import React, { useState } from 'react';
import { useTransClient } from '@/app/i18n/client';
import { Button, Input, message } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { getYouTubeAuthUrlApi } from '@/api/youtube';

const YouTubeAuth: React.FC = () => {
  const { t } = useTransClient('youtube');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (response?.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('获取授权 URL 失败:', error);
      message.error(t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('youtubeAuth')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('authDescription')}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('email')}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<MailOutlined />}
              />
            </div>
          </div>

          <div>
            <Button
              type="primary"
              onClick={handleAuth}
              loading={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t('authorize')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeAuth; 