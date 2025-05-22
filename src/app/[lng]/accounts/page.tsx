"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, message, Modal, Form, Input, Select, InputNumber, Space, Tag } from "antd";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { 
  SocialAccount, 
  createOrUpdateAccountApi, 
  updateAccountStatusApi, 
  getAccountListApi 
} from "@/api/apiReq";
import styles from "./accounts.module.css";

const { Option } = Select;

const PLATFORM_TYPES = [
  { value: 'douyin', label: '抖音', color: '#000000' },
  { value: 'xiaohongshu', label: '小红书', color: '#FF2442' },
  { value: 'bilibili', label: 'Bilibili', color: '#FB7299' },
  { value: 'kuaishou', label: '快手', color: '#FFC300' },
  { value: 'facebook', label: 'Facebook', color: '#1877F2' },
  { value: 'twitter', label: 'Twitter', color: '#1DA1F2' },
];

export default function AccountsPage() {
  const router = useRouter();
  const { token } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 获取账户列表
  const fetchAccounts = async () => {
    try {
      const response: any = await getAccountListApi();
      if (!response) {
        message.error('获取账户列表失败');
        return;
      }
      
      if (response.code === 0 && response.data) {
        setAccounts(response.data);
      } else {
        message.error(response.msg || '获取账户列表失败');
      }
    } catch (error) {
      message.error('获取账户列表失败');
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
    fetchAccounts();
  }, [token, router]);

  // 处理账户状态更新
  const handleStatusChange = async (id: number, status: number) => {
    try {
      const response: any = await updateAccountStatusApi({ id, status });
      if (!response) {
        message.error('更新状态失败');
        return;
      }

      if (response.code === 0) {
        message.success('更新状态成功');
        fetchAccounts();
      } else {
        message.error(response.msg || '更新状态失败');
      }
    } catch (error) {
      message.error('更新状态失败');
    }
  };

  // 处理账户创建/更新
  const handleSubmit = async (values: any) => {
    try {
      const response: any = await createOrUpdateAccountApi(values);
      if (!response) {
        message.error('操作失败');
        return;
      }

      if (response.code === 0) {
        message.success('操作成功');
        setIsModalOpen(false);
        form.resetFields();
        fetchAccounts();
      } else {
        message.error(response.msg || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const platform = PLATFORM_TYPES.find(p => p.value === type);
        return platform ? (
          <Tag color={platform.color}>{platform.label}</Tag>
        ) : type;
      }
    },
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '粉丝数',
      dataIndex: 'fansCount',
      key: 'fansCount',
    },
    {
      title: '作品数',
      dataIndex: 'workCount',
      key: 'workCount',
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      render: (income: number) => `¥${income.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SocialAccount) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => handleStatusChange(record.id, record.status === 1 ? 0 : 1)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card 
        title="三方账户管理" 
        className={styles.card}
        extra={
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            添加账户
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={accounts} 
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="添加账户"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="请选择平台">
              {PLATFORM_TYPES.map(platform => (
                <Option key={platform.value} value={platform.value}>
                  {platform.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="account"
            label="账号"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input placeholder="请输入账号" />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            name="loginCookie"
            label="登录Cookie"
            rules={[{ required: true, message: '请输入登录Cookie' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入登录Cookie" />
          </Form.Item>

          <Form.Item
            name="uid"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户ID" />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="头像URL"
            rules={[{ required: true, message: '请输入头像URL' }]}
          >
            <Input placeholder="请输入头像URL" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 