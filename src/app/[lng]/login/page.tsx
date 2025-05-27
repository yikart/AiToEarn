"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import { message, Modal, Form, Input, Button } from "antd";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { 
  loginWithMailApi, 
  getRegistUrlApi, 
  checkRegistStatusApi, 
  googleLoginApi,
  GoogleLoginParams
} from "@/api/apiReq";
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
  const [isActivating, setIsActivating] = useState(false);
  const [activationTimer, setActivationTimer] = useState<NodeJS.Timeout | null>(null);
  const [registUrl, setRegistUrl] = useState("");
  const [showRegistModal, setShowRegistModal] = useState(false);

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
      setIsActivating(true);
      message.info('激活链接已发送至邮箱，请查收并点击激活');
      
      // 开始循环检查注册状态
      const timer = setInterval(async () => {
        try {
          const response = await checkRegistStatusApi({
            code: registCode,
            mail: email,
            password: values.password,
            inviteCode: values.inviteCode || ''
          });
          
          if (!response) return;
          
          if (response.code === 0 && response.data.token) {
            // 注册成功，清除定时器
            if (activationTimer) {
              clearInterval(activationTimer);
            }
            setIsActivating(false);
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
      }, 2000); // 每2秒检查一次
      
      setActivationTimer(timer);
    } catch (error) {
      message.error('注册失败，请稍后重试');
      setIsActivating(false);
    }
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (activationTimer) {
        clearInterval(activationTimer);
      }
    };
  }, [activationTimer]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log('credentialResponse', credentialResponse)

    try {
      const params: any = {
        platform: 'google',
        // clientId: credentialResponse.clientId,
        // credential: credentialResponse.credential
      };

      const response: any = await googleLoginApi(params);
      console.log('login response', response)
      return
      if (!response) {
        message.error('Google 登录失败');
        return;
      }

      if (response.code === 0) {
        if (response.data.type === 'login') {
          // 直接登录成功
          setToken(response.data.token);
          message.success('登录成功');
          router.push('/');
        }
      } else {
        message.error(response.msg || 'Google 登录失败');
      }
    } catch (error) {
      message.error('Google 登录失败');
    }
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
          <Button type="primary" htmlType="submit" block className={styles.submitButton}>
            登录
          </Button>
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

        </div>
      </div>

      <Modal
        title="完成注册"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setIsChecking(false);
          setIsActivating(false);
          if (activationTimer) {
            clearInterval(activationTimer);
          }
        }}
        maskClosable={false}
        keyboard={false}
        closable={true}
        footer={null}
        className={styles.modalWrapper}
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
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={isActivating}
            >
              {isActivating ? '等待激活中...' : '完成注册'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 