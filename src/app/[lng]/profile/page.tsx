"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input } from "antd";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, ThunderboltOutlined, HistoryOutlined, DollarOutlined } from "@ant-design/icons";
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

  // 获取会员状态和过期时间
  const isVip = userInfo?.vipInfo?.id ? true : false;
  const vipExpireTime = userInfo?.vipInfo?.expireTime ? new Date(userInfo.vipInfo.expireTime).toLocaleDateString() : '';
  const vipCycleType = userInfo?.vipInfo?.cycleType === 1 ? '月度会员' : '年度会员';

  // 会员权益数据
  const vipBenefits = [
    { icon: <CrownOutlined />, name: "专属标识" },
    { icon: <TrophyOutlined />, name: "高级功能" },
    { icon: <GiftOutlined />, name: "会员礼包" },
    { icon: <StarOutlined />, name: "优先支持" },
    { icon: <DollarOutlined />, name: "优惠折扣" },
    { icon: <HistoryOutlined />, name: "无限时长" },
    { icon: <ThunderboltOutlined />, name: "极速体验" },
    { icon: <RocketOutlined />, name: "更多特权" },
  ];

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
        fetchUserInfo();
        message.success('更新成功');
        setIsModalOpen(false);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleGoToVipPage = () => {
    router.push('/vip');
  };

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.vipCard}>
        <div className={styles.vipContent}>
          <div className={styles.vipHeader}>
            <span className={styles.vipIcon}><CrownOutlined /></span>
            <h2 className={styles.vipTitle}>PLUS会员</h2>
          </div>
          {isVip ? (<p className={styles.vipDescription}>
            尊敬的VIP用户，您已解锁全部会员权益
          </p>
          ) : (
            <p className={styles.vipDescription}>
              开通会员解锁全部功能，立享8种权益
            </p>
          )}
          <div className={styles.benefitsGrid}>
            {vipBenefits.map((benefit, index) => (
              <div key={index} className={styles.benefitItem}>
                <div className={styles.benefitIcon}>{benefit.icon}</div>
                <p className={styles.benefitName}>{benefit.name}</p>
              </div>
            ))}
          </div>
          {isVip ? (
            <div className={styles.vipInfo}>
            </div>
          ) : (
            <button className={styles.activateButton} onClick={handleGoToVipPage}>
              立即开通
            </button>
          )}
        </div>
      </div>

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
          {isVip && (
            <>
              <Descriptions.Item label="会员类型">{vipCycleType}</Descriptions.Item>
              <Descriptions.Item label="会员到期时间">{vipExpireTime}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      {!isVip && (
        <div className={styles.normalUserCallToAction}>
          <p>开通PLUS会员，体验更多高级功能！</p>
          <button className={styles.activateButton} onClick={handleGoToVipPage}>
            立即开通PLUS会员
          </button>
        </div>
      )}

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