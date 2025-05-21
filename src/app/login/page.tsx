"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实现登录逻辑
    console.log("登录:", { email, password });
  };

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