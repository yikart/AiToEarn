"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { getUserInfoApi, updateUserInfoApi } from "@/api/apiReq";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, setUserInfo, clearLoginStatus, token } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response: any = await getUserInfoApi();
      if (!response) {
        message.error('获取用户信息失败');
        return;
      }
      
      if (response.code === 0 && response.data) {
        setUserInfo(response.data);
      } else {
        message.error(response.message || '获取用户信息失败');
      }
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      message.error('请先登录');
      router.push('/login');
      return;
    }
    fetchUserInfo();
  }, [token, router]);

  const handleLogout = () => {
    clearLoginStatus();
    message.success('退出登录成功');
    router.push('/login');
  };

  const handleUpdateName = async (values: { name: string }) => {
    try {
      const response: any = await updateUserInfoApi(values);
      if (!response) {
        message.error('更新失败');
        return;
      }

      if (response.code === 0 && response.data) {
        setUserInfo(response.data);
        message.success('更新成功');
        setIsModalOpen(false);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
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
          <div className={styles.actions}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              修改用户名
            </Button>
            <Button type="primary" danger onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="用户ID">{userInfo?.id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{userInfo?.name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{userInfo?.mail}</Descriptions.Item>
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

      <Modal
        title="修改用户名"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleUpdateName}
          initialValues={{ name: userInfo?.name }}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名长度不能小于2个字符' },
              { max: 20, message: '用户名长度不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 