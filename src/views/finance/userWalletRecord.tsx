/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 23:01:36
 * @LastEditors: nevin
 * @Description: 用户金额记录 userWalletRecord
 */
import { Button, Table, Space, Tag, message, Modal, Input, Form, Card, Typography, Select } from 'antd';
import { useState, useEffect, useRef } from 'react';
import AddWalletAccount from './components/addWalletAccount';
import { financeApi } from '@/api/finance';
import { AddWalletAccountRef } from './components/addWalletAccount';
import { UserWalletRecord } from '@/api/types/finance';
import { UserWalletAccount } from '@/api/types/userWalletAccount';
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styles from './userWalletRecord.module.scss';
import moment from 'moment';   
const { Title } = Typography;

export default function Page() {
  const [walletAccountList, setWalletAccountList] = useState<UserWalletRecord[]>([]);
  const [walletAccounts, setWalletAccounts] = useState<UserWalletAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWithdrawModalVisible, setIsWithdrawModalVisible] = useState(false);
  const [form] = Form.useForm();
  const Ref_AddWalletAccountRef = useRef<AddWalletAccountRef>(null);

  async function getDataList() {
    setLoading(true);
    try {
      const res = await financeApi.getWithdrawList({
        page: 1,
        pageSize: 10,
      });
      setWalletAccountList(res.items);
    } catch (error) {
      console.error('获取钱包记录列表失败:', error);
      message.error('获取钱包记录列表失败');
    } finally {
      setLoading(false);
    }
  }

  // 获取提现账户列表
  async function getWalletAccounts() {
    try {
      const res = await financeApi.getUserWalletAccountList();
      setWalletAccounts(res);
    } catch (error) {
      console.error('获取提现账户列表失败:', error);
      message.error('获取提现账户列表失败');
    }
  }

  const handleWithdraw = async (values: { amount: number; walletAccountId: string }) => {
    try {
      await financeApi.addUserWalletRecord({
        walletAccountId: values.walletAccountId,
        balance: values.amount
      });
      message.success('提现申请提交成功');
      setIsWithdrawModalVisible(false);
      form.resetFields();
      getDataList();
    } catch (error) {
      console.error('提现申请失败:', error);
      message.error('提现申请失败');
    }
  };

  useEffect(() => {
    getDataList();
    getWalletAccounts();
  }, []);

  const columns = [
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'withdraw' ? 'red' : 'green'}>
          {type === 'WITHDRAW' ? '提现' : '充值'}
        </Tag>
      ),
    },
    {
      title: '账户',
      dataIndex: 'account',
      key: 'account',
      render: (account: any) => (
        <Space>
          {account.type === 'ZFB' ? '支付宝' : '微信'} - {account.account}
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'balance',
      key: 'balance',
      render: (amount: number, record: UserWalletRecord) => (
        <Space>
          {/* {amount > 9999 ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> : <ArrowDownOutlined style={{ color: '#ff4d4f' }} />} */}
          <span style={{ color: amount < 0 ? '#ff4d4f' : '#52c41a' }}>
          {record.type === 'WITHDRAW' ? '-' : '+'} {amount}
          </span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: any) => (
        <Tag color={status == 0 ? 'orange' : status == 1 ? 'green' : 'red'}>
          {status == 0 ? '处理中' : status == 1 ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (createTime: string) => {
        return moment(createTime).format('YYYY-MM-DD HH:mm:ss');  
      },
    },
  ];

  return (
    <div className={styles.container}>
      <AddWalletAccount ref={Ref_AddWalletAccountRef} />
      <Card className={styles.headerCard} bordered={false}>
        <div className={styles.header}>
          <Title level={4} className={styles.title}>交易记录</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsWithdrawModalVisible(true)}
            className={styles.withdrawButton}
          >
            申请提现
          </Button>
        </div>
      </Card>
      <Card className={styles.tableCard} bordered={false}>
        <Table
          columns={columns}
          dataSource={walletAccountList}
          rowKey="id"
          loading={loading}
          pagination={false}
          className={styles.table}
        />
      </Card>
      <Modal
        title="申请提现"
        open={isWithdrawModalVisible}
        onCancel={() => setIsWithdrawModalVisible(false)}
        footer={null}
        className={styles.modal}
      >
        <Form form={form} onFinish={handleWithdraw}>
          <Form.Item
            name="walletAccountId"
            label="提现账户"
            rules={[{ required: true, message: '请选择提现账户' }]}
          >
            <Select placeholder="请选择提现账户">
              {walletAccounts.map(account => (
                <Select.Option key={account.id} value={account.id}>
                  {account.type === 'ZFB' ? '支付宝' : '微信'} - {account.account}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[
              { required: true, message: '请输入提现金额' },
              { min: 0, message: '提现金额必须大于0' }
            ]}
          >
            <Input type="number" placeholder="请输入提现金额" className={styles.input} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
