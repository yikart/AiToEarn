"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, message, Modal, Form, Input, Select, InputNumber, Space, Tag, Descriptions } from "antd";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { useAccountStore } from "@/store/account";
import { 
  SocialAccount, 
  createOrUpdateAccountApi, 
  updateAccountStatusApi, 
  getAccountListApi,
  updateAccountStatisticsApi,
  UpdateAccountStatisticsParams,
  deleteAccountApi
} from "@/api/apiReq";
import styles from "./accounts.module.css";

const { Option } = Select;

const PLATFORM_TYPES = [
  { value: 'douyin', label: '抖音', color: '#000000' },
  { value: 'xhs', label: '小红书', color: '#FF2442' },
  { value: 'bilibili', label: 'Bilibili', color: '#FB7299' },
  { value: 'KWAI', label: '快手', color: '#FFC300' },
  { value: 'facebook', label: 'Facebook', color: '#1877F2' },
  { value: 'twitter', label: 'Twitter', color: '#1DA1F2' },
];

export default function AccountsPage() {
  const router = useRouter();
  const { token } = useUserStore();
  const { accounts, loading, fetchAccounts } = useAccountStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<SocialAccount | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) {
      message.error('请先登录');
      router.push('/login');
      return;
    }
    fetchAccounts();
  }, [token, router, fetchAccounts]);

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

  // 处理统计数据更新
  const handleStatisticsUpdate = async (record: SocialAccount) => {
    try {
      const params: UpdateAccountStatisticsParams = {
        id: record.id,
        fansCount: record.fansCount+1,
        readCount: record.readCount+1,
        workCount:  record.workCount+1,
        likeCount: record.likeCount+1,
        collectCount: record.collectCount+1,
        commentCount: record.commentCount+1,
        income: record.income+1
      };

      const response: any = await updateAccountStatisticsApi(params);
      if (!response) {
        message.error('更新统计数据失败');
        return;
      }

      if (response.code === 0) {
        message.success('更新统计数据成功');
        fetchAccounts();
      } else {
        message.error(response.msg || '更新统计数据失败');
      }
    } catch (error) {
      message.error('更新统计数据失败');
    }
  };

  // 处理账户删除
  const handleDelete = async (id: number) => {
    try {
      const response: any = await deleteAccountApi(id);
      if (!response) {
        message.error('删除账户失败');
        return;
      }

      if (response.code === 0) {
        message.success('删除账户成功');
        fetchAccounts();
      } else {
        message.error(response.msg || '删除账户失败');
      }
    } catch (error) {
      message.error('删除账户失败');
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
      title: '用户id',
      dataIndex: 'uid',
      key: 'uid',
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
        <Tag color={status === 1 ? 'error' : 'success'}>
          {status === 1 ? '失效' : '在线'}
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
            onClick={() => {
              setCurrentAccount(record);
              setIsDetailModalOpen(true);
            }}
          >
            详情
          </Button>
          <Button 
            type="link" 
            onClick={() => handleStatusChange(record.id, record.status === 1 ? 0 : 1)}
          >
            {record.status === 1 ? '登录' : '下线'}
          </Button>
          <Button 
            type="link" 
            onClick={() => handleStatisticsUpdate(record)}
          >
            更新统计
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: `确定要删除账号 ${record.account} 吗？`,
                okText: '确认',
                cancelText: '取消',
                onOk: () => handleDelete(record.id)
              });
            }}
          >
            删除
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

      <Modal
        title="账户详情"
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setCurrentAccount(null);
        }}
        footer={null}
        width={600}
      >
        {currentAccount && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="平台">
              {PLATFORM_TYPES.find(p => p.value === currentAccount.type)?.label}
            </Descriptions.Item>
            <Descriptions.Item label="账号">{currentAccount.account}</Descriptions.Item>
            <Descriptions.Item label="昵称">{currentAccount.nickname}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{currentAccount.uid}</Descriptions.Item>
            <Descriptions.Item label="头像URL">
              <a href={currentAccount.avatar} target="_blank" rel="noopener noreferrer">
                {currentAccount.avatar}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="登录Cookie">
              <div style={{ wordBreak: 'break-all' }}>{currentAccount.loginCookie}</div>
            </Descriptions.Item>
            <Descriptions.Item label="粉丝数">{currentAccount.fansCount}</Descriptions.Item>
            <Descriptions.Item label="作品数">{currentAccount.workCount}</Descriptions.Item>
            <Descriptions.Item label="点赞数">{currentAccount.likeCount}</Descriptions.Item>
            <Descriptions.Item label="评论数">{currentAccount.commentCount}</Descriptions.Item>
            <Descriptions.Item label="转发数">{currentAccount.forwardCount}</Descriptions.Item>
            <Descriptions.Item label="收藏数">{currentAccount.collectCount}</Descriptions.Item>
            <Descriptions.Item label="阅读数">{currentAccount.readCount}</Descriptions.Item>
            <Descriptions.Item label="收入">¥{currentAccount.income.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={currentAccount.status === 1 ? 'error' : 'success'}>
                {currentAccount.status === 1 ? '失效' : '在线'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentAccount.createTime).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(currentAccount.updateTime).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
} 