"use client";

import { useState, useEffect } from "react";
import { Form, Input, Button, message, Modal } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { sendResetPasswordMailApi, resetPasswordApi } from "@/api/apiReq";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      if (!response) {
        message.error('发送失败');
        return;
      }

      if (response.code === 0 && response.data) {
        setResetCode(response.data);
        setIsModalOpen(true);
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error) {
      message.error('发送失败');
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
      message.error('无效的重置码');
      return;
    }

    try {
      setLoading(true);
      const response: any = await resetPasswordApi({
        code: resetCode,
        mail: form.getFieldValue('mail'),
        password: values.password
      });

      if (!response) {
        message.error('重置失败');
        return;
      }

      if (response.code === 0 && response.data?.token) {
        clearPolling();
        message.success('密码重置成功');
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
            message.success('密码重置成功');
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
      message.info('请点击邮件中的重置链接完成密码重置');
    } catch (error) {
      clearPolling();
      message.error('重置失败');
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
        <h1 className={styles.title}>重置密码</h1>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="mail"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入注册邮箱" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              className={styles.submitButton}
            >
              发送重置链接
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.links}>
          <Link href="/login" className={styles.link}>
            返回登录
          </Link>
        </div>
      </div>

      <Modal
        title="重置密码"
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
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能小于6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认密码" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading || isPolling}
              className={styles.submitButton}
            >
              {isPolling ? '等待邮件确认中...' : '确认重置'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 