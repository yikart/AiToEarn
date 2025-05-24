"use client";

import styles from "@/app/styles/page.module.scss";
import { Button } from "antd";
import React from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleAccounts = () => {
    router.push("/accounts");
  };

  return (
    <div className={styles.page}>
      <Button onClick={handleProfile}>个人中心</Button>
      <Button onClick={handleAccounts}>账户中心</Button>
    </div>
  );
}
