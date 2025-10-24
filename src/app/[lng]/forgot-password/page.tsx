"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendResetPasswordMailApi, resetPasswordApi } from "@/api/apiReq";
import { useTransClient } from "@/app/i18n/client";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useTransClient("login");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetForm] = Form.useForm();
  const [resetCode, setResetCode] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // 清除轮询
  const clearPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
  };

  // 处理Modal关闭
  const handleModalClose = () => {
    clearPolling();
    setIsModalOpen(false);
  };

  // 处理发送重置密码邮件
  const handleSubmit = async (values: { mail: string }) => {
    try {
      setLoading(true);
      const response: any = await sendResetPasswordMailApi(values);

      if (response.code === 0 && response.data) {
        setResetCode(response.data);
        setIsModalOpen(true);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  // 处理重置密码
  const handleResetPassword = async (values: { password: string }) => {
    if (!resetCode) {
      message.error(t('invalidResetCode' as any));
      return;
    }

    try {
      setLoading(true);
      const response: any = await resetPasswordApi({
        code: resetCode,
        mail: form.getFieldValue('mail'),
        password: values.password
      });

      if (response.code === 0 && response.data?.token) {
        clearPolling();
        message.success(t('resetSuccess' as any));
        router.push('/login');
        return;
      }

      // 开始轮询检查用户是否点击邮箱链接
      setIsPolling(true);
      const checkResetStatus = async () => {
        try {
          const statusResponse: any = await resetPasswordApi({
            code: resetCode,
            mail: form.getFieldValue('mail'),
            password: values.password
          });

          if (statusResponse?.code === 0 && statusResponse.data?.token) {
            clearPolling();
            message.success(t('resetSuccess' as any));
            router.push('/login');
            return true;
          }
          return false;
        } catch (error) {
          clearPolling();
          return false;
        }
      };

      // 设置轮询间隔
      const interval = setInterval(async () => {
        const isSuccess = await checkResetStatus();
        if (isSuccess) {
          clearPolling();
        }
      }, 2000);
      setPollingInterval(interval);

      // 显示提示信息
      message.info(t('clickEmailLinkToReset' as any));
    } catch (error) {
      clearPolling();
      message.error(t('resetFailed' as any));
    } finally {
      setLoading(false);
    }
  };

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setIsPolling(false);
    };
  }, [pollingInterval]);

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>{t('resetPassword' as any)}</h1>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="mail"
            label={t('emailLabel' as any)}
            rules={[
              { required: true, message: t('emailRequired' as any) },
              { type: 'email', message: t('emailInvalid' as any) }
            ]}
          >
            <Input placeholder={t('emailPlaceholder' as any)} />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              className={styles.submitButton}
            >
              {t('sendResetLink' as any)}
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            {t('backToLogin' as any)}
          </Link>
        </div>
      </div>

      <Modal
        title={t('resetPassword' as any)}
        open={isModalOpen}
        onCancel={handleModalClose}
        maskClosable={false}
        footer={null}
      >
        <Form
          form={resetForm}
          onFinish={handleResetPassword}
          layout="vertical"
        >
          <Form.Item
            name="password"
            label={t('newPassword' as any)}
            rules={[
              { required: true, message: t('newPasswordRequired' as any) },
              { min: 6, message: t('newPasswordMinLength' as any) }
            ]}
          >
            <Input.Password placeholder={t('newPasswordPlaceholder' as any)} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('confirmPassword' as any)}
            dependencies={['password']}
            rules={[
              { required: true, message: t('confirmPasswordRequired' as any) },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('confirmPasswordMismatch' as any)));
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('confirmPasswordPlaceholder' as any)} />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading || isPolling}
              className={styles.submitButton}
            >
              {isPolling ? t('waitingForEmailConfirmation' as any) : t('confirmReset' as any)}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 