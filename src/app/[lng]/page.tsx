"use client";

import styles from "./page.module.scss";
import { Button } from "antd";
import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleProfile = () => {
    router.push("/profile");
  };


  return (
    <div className={styles.page}>
      <Button onClick={handleLogin}>登录页面</Button>
      <Button onClick={handleProfile}>个人中心</Button>
    </div>
  );
}
