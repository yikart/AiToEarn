"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Button, message, Modal, Form, Input, Tabs, Table, Tag, Popconfirm, DatePicker, Select, Space } from "antd";
import { CrownOutlined, TrophyOutlined, GiftOutlined, StarOutlined, RocketOutlined, ThunderboltOutlined, HistoryOutlined, DollarOutlined, ShoppingCartOutlined, UserOutlined, GiftFilled } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { getUserInfoApi, updateUserInfoApi, getPointsRecordsApi } from "@/api/apiReq";

import styles from "./profile.module.css";
import { useTransClient } from "@/app/i18n/client";

const { TabPane } = Tabs;
const { Option } = Select;

export default function ProfilePage() {
  const router = useRouter();
  const { userInfo, setUserInfo, clearLoginStatus, token } = useUserStore();
  const { t } = useTransClient('profile');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  


  // 积分记录相关状态
  const [pointsRecords, setPointsRecords] = useState<any[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsPagination, setPointsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 积分记录类型定义
  interface PointsRecord {
    id: string;
    userId: string;
    amount: number;
    balance: number;
    type: string;
    description: string;
    metadata?: any;
    createdAt?: string;
  }
  


  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response: any = await getUserInfoApi();
      if (!response) {
        message.error(t('getUserInfoFailed'));
        return;
      }
      
      if (response.code === 0 && response.data) {
        setUserInfo(response.data);
      } else {
        message.error(response.message || t('getUserInfoFailed'));
      }
    } catch (error) {
      message.error(t('getUserInfoFailed'));
    } finally {
      setLoading(false);
    }
  };



  // 获取积分记录
  const fetchPointsRecords = async (params: { page: number; pageSize: number }) => {
    setPointsLoading(true);
    try {
      const response = await getPointsRecordsApi(params);
      if (response?.code === 0 && response.data) {
        const paginatedData = response.data;
        setPointsRecords(paginatedData.list || []);
        setPointsPagination({
          current: params.page,
          pageSize: params.pageSize,
          total: paginatedData.total || 0
        });
      } else {
        message.error(response?.message || '获取积分记录失败');
      }
    } catch (error) {
      message.error('获取积分记录失败');
    } finally {
      setPointsLoading(false);
    }
  };



  useEffect(() => {
    if (!token) {
      message.error(t('pleaseLoginFirst'));
      router.push('/login');
      return;
    }
    fetchUserInfo();
  }, [token, router]);

  const handleLogout = () => {
    clearLoginStatus();
    message.success(t('logoutSuccess'));
    router.push('/login');
  };

  const handleUpdateName = async (values: { name: string }) => {
    try {
      const response: any = await updateUserInfoApi(values);
      if (!response) {
        message.error(t('updateFailed'));
        return;
      }

      if (response.code === 0 && response.data) {
        fetchUserInfo();
        message.success(t('updateSuccess'));
        setIsModalOpen(false);
      } else {
        message.error(response.message || t('updateFailed'));
      }
    } catch (error) {
      message.error(t('updateFailed'));
    }
  };












  // 积分记录表格列
  const pointsColumns = [
    {
      title: t('points.pointsChange'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {amount > 0 ? '+' : ''}{amount}
        </span>
      ),
    },
    {
      title: t('points.balance'),
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {balance}
        </span>
      ),
    },
    {
      title: t('points.changeType'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: { [key: string]: { color: string; text: string } } = {
          'ai_service': { color: 'green', text: t('points.aiService') },
          'user_register': { color: 'blue', text: t('points.userRegister') },
          'earn': { color: 'green', text: t('points.earn') },
          'spend': { color: 'red', text: t('points.spend') },
          'refund': { color: 'blue', text: t('points.refund') },
          'expire': { color: 'orange', text: t('points.expire') }
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('points.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  // 个人信息内容
  const renderProfileContent = () => (
    <>
      <Card 
        title={t('personalInfo')} 
        className={styles.card}
        extra={
          <div className={styles.actions}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              {t('modifyUsername')}
            </Button>
            <Button type="primary" danger onClick={handleLogout}>
              {t('logout')}
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label={t('userId')}>{userInfo?.id}</Descriptions.Item>
          <Descriptions.Item label={t('username')}>{userInfo?.name}</Descriptions.Item>
          <Descriptions.Item label={t('email')}>{userInfo?.mail}</Descriptions.Item>
          <Descriptions.Item label={t('accountStatus')}>
            {userInfo?.status === 1 ? t('normal') : t('disabled')}
          </Descriptions.Item>
          <Descriptions.Item label='邀请码'>{userInfo?.popularizeCode}</Descriptions.Item>
          <Descriptions.Item label='我的积分'>{userInfo?.score}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );



  // 积分记录内容
  const renderPointsContent = () => (
    <div className={styles.orderContent}>
      <Card>
        <Table
          columns={pointsColumns}
          dataSource={pointsRecords}
          loading={pointsLoading}
          rowKey="id"
          className={styles.pointsTable}
          pagination={{
            current: pointsPagination.current,
            pageSize: pointsPagination.pageSize,
            total: pointsPagination.total,
            onChange: (page, size) => {
              fetchPointsRecords({ page, pageSize: size || 10 });
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('points.totalRecords', { total }),
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: pointsLoading ? t('loading') : t('points.noPointsRecords')
          }}
        />
      </Card>
    </div>
  );

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Tabs 
        defaultActiveKey="profile" 
        size="large"
        onChange={(key) => {
          if (key === 'points') {
            fetchPointsRecords({ page: 1, pageSize: 10 });
          }
        }}
      >
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              {t('personalInfo')}
            </span>
          } 
          key="profile"
        >
          {renderProfileContent()}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <GiftFilled />
              {t('points.title')}
            </span>
          } 
          key="points"
        >
          {renderPointsContent()}
        </TabPane>
      </Tabs>

      <Modal
        title={t('modifyUsername')}
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
            label={t('username')}
            rules={[
              { required: true, message: t('pleaseEnterUsername') },
              { min: 2, message: t('usernameLengthMin') },
              { max: 20, message: t('usernameLengthMax') }
            ]}
          >
            <Input placeholder={t('pleaseEnterUsername')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('confirmModify')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>



    </div>
  );
} 