"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message } from "antd";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, clearLoginStatus } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo) {
      message.error('请先登录');
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [userInfo, router]);

  const handleLogout = () => {
    clearLoginStatus();
    message.success('退出登录成功');
    router.push('/login');
  };

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Card 
        title="个人信息" 
        className={styles.card}
        extra={
          <Button type="primary" danger onClick={handleLogout}>
            退出登录
          </Button>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户ID">{userInfo?.id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{userInfo?.name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{userInfo?.phone}</Descriptions.Item>
          <Descriptions.Item label="账号状态">
            {userInfo?.status === 1 ? '正常' : '禁用'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(userInfo?.createTime || '').toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {new Date(userInfo?.updateTime || '').toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
} 