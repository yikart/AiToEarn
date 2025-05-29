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
import { useTransClient } from "@/app/i18n/client";

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUserInfo } = useUserStore();
  const { t } = useTransClient("login");
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
          message.success(t('loginSuccess'));
          router.push('/');
        }
      } else {
        message.error(response.msg || t('loginFailed'));
      }
    } catch (error) {
      message.error(t('loginError'));
    }
  };

  const handleRegistSubmit = async (values: { password: string; inviteCode?: string }) => {
    try {
      setIsActivating(true);
      message.info(t('activationEmailSent'));
      
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
            message.success(t('registerSuccess'));
            router.push('/');
          }
        } catch (error) {
          console.error(t('checkStatusError'), error);
        }
      }, 2000); // 每2秒检查一次
      
      setActivationTimer(timer);
    } catch (error) {
      message.error(t('registerError'));
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
        clientId: credentialResponse.clientId,
        credential: credentialResponse.credential
      };

      const response: any = await googleLoginApi(params);
      console.log('login response', response)
      if (!response) {
        message.error(t('googleLoginFailed'));
        return;
      }

      if (response.code === 0) {
        if (response.data.type === 'login') {
          // 直接登录成功
          setToken(response.data.token);
          if (response.data.userInfo) {
            setUserInfo(response.data.userInfo);
          }
          message.success(t('loginSuccess'));
          router.push('/');
        }
      } else {
        message.error(response.msg || t('googleLoginFailed'));
      }
    } catch (error) {
      message.error(t('googleLoginFailed'));
    }
  };

  const handleGoogleError = () => {
    console.log(t('googleLoginFailed'));
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>{t('welcomeBack')}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <Button type="primary" htmlType="submit" block className={styles.submitButton}>
            {t('login')}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>{t('or')}</span>
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
            {t('forgotPassword')}
          </Link>
        </div>
      </div>

      <Modal
        title={t('completeRegistration')}
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
            label={t('setPassword')}
            name="password"
            rules={[
              { required: true, message: t('passwordRequired') },
              { min: 6, message: t('passwordMinLength') }
            ]}
          >
            <Input.Password placeholder={t('enterPassword')} />
          </Form.Item>
          
          <Form.Item
            label={t('inviteCode')}
            name="inviteCode"
          >
            <Input placeholder={t('enterInviteCode')} />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={isActivating}
            >
              {isActivating ? t('waitingForActivation') : t('completeRegistration')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 