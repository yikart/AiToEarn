"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import { message } from "antd";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { loginWithMailApi, getRegistUrlApi, checkRegistStatusApi, LoginResponse } from "@/api/apiReq";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [registUrl, setRegistUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginWithMailApi({ mail: email, password });
      if (!response) return;
      
      if (response.code === 0) {
        if (response.data.type === 'regist') {
          // 用户未注册，获取注册链接
          const registResponse = await getRegistUrlApi(email);
          if (!registResponse) return;
          
          if (registResponse.code === 0 && registResponse.data.registUrl) {
            setRegistUrl(registResponse.data.registUrl);
            setIsChecking(true);
            message.info('请完成注册后继续');
          }
        } else if (response.data.type === 'login' && response.data.token) {
          // 登录成功
          localStorage.setItem('token', response.data.token);
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

  // 检查注册状态
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isChecking && registUrl) {
      timer = setInterval(async () => {
        try {
          const response = await checkRegistStatusApi(email);
          if (!response) return;
          
          if (response.code === 0 && response.data.type === 'login' && response.data.token) {
            clearInterval(timer);
            setIsChecking(false);
            localStorage.setItem('token', response.data.token);
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
  }, [isChecking, registUrl, email, router]);

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
          <button type="submit" className={styles.submitButton}>
            登录
          </button>
        </form>

        {registUrl && (
          <div className={styles.registLink}>
            <a href={registUrl} target="_blank" rel="noopener noreferrer">
              点击这里完成注册
            </a>
          </div>
        )}

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
    </div>
  );
} 