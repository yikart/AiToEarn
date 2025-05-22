"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import { message, Modal, Form, Input, Button } from "antd";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { loginWithMailApi, checkRegistStatusApi, LoginResponse } from "@/api/apiReq";
import { useUserStore } from "@/store/user";

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUserInfo } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registCode, setRegistCode] = useState("");
  const [form] = Form.useForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginWithMailApi({ mail: email, password });
      if (!response) return;
      
      if (response.code === 0) {
        if (response.data.type === 'regist') {
          // 用户未注册，显示弹窗提示
          setRegistCode(response.data.code || '');
          setIsModalOpen(true);
          setIsChecking(true);
        } else if (response.data.token) {
          // 登录成功
          setToken(response.data.token);
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo);
          }
          message.success('登录成功');
          router.push('/');
        }
      } else {
        message.error(response.msg || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请稍后重试');
    }
  };

  const handleRegistSubmit = async (values: { password: string; inviteCode?: string }) => {
    try {
      const response = await checkRegistStatusApi({
        code: registCode,
        mail: email,
        password: values.password,
        inviteCode: values.inviteCode || ''
      });
      
      if (!response) return;
      
      if (response.code === 0 && response.data.token) {
        setIsChecking(false);
        setIsModalOpen(false);
        setToken(response.data.token);
        if (response.data.userInfo) {
          setUserInfo(response.data.userInfo);
        }
        message.success('注册成功，已自动登录');
        router.push('/');
      } else {
        message.error(response.msg || '注册失败');
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
    }
  };

  // 检查注册状态
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isChecking && !isModalOpen) {
      timer = setInterval(async () => {
        try {
          const response = await checkRegistStatusApi({
            code: registCode,
            mail: email,
            password: form.getFieldValue('password'),
            inviteCode: form.getFieldValue('inviteCode') || ''
          });
          
          if (!response) return;
          
          if (response.code === 0 && response.data.token) {
            clearInterval(timer);
            setIsChecking(false);
            setIsModalOpen(false);
            setToken(response.data.token);
            if (response.data.userInfo) {
              setUserInfo(response.data.userInfo);
            }
            message.success('注册成功，已自动登录');
            router.push('/');
          }
        } catch (error) {
          console.error('检查注册状态失败:', error);
        }
      }, 3000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isChecking, isModalOpen, email, router, registCode, form, setToken, setUserInfo]);

  const handleGoogleSuccess = (credentialResponse: any) => {
    console.log("Google 登录成功:", credentialResponse);
    // TODO: 将 credential 发送到后端验证
  };

  const handleGoogleError = () => {
    console.log("Google 登录失败");
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>欢迎回来</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <button type="submit"  >
            登录
          </button>
        </form>

        <div className={styles.divider}>
          <span>或 </span>
        </div>

        <div className={styles.googleButtonWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            text="signin_with"
            locale="zh_CN"
            width="100%"
            size="large"
          />
        </div>

        <div className={styles.links}>
          <Link href="/forgot-password" className={styles.link}>
            忘记密码？
          </Link>
          <Link href="/register" className={styles.link}>
            注册账号
          </Link>
        </div>
      </div>

      <Modal
        title="完成注册"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setIsChecking(false);
        }}
        maskClosable={false}
        keyboard={false}
        closable={true}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleRegistSubmit}
          layout="vertical"
        >
          <Form.Item
            label="设置密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度不能小于6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          
          <Form.Item
            label="邀请码（选填）"
            name="inviteCode"
          >
            <Input placeholder="请输入邀请码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              完成注册
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 