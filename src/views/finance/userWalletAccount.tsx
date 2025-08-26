/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-01 19:39:12
 * @LastEditors: nevin
 * @Description: 用户的钱包账户 userWalletAccount
 */
import { Button, Table, Tag, message } from 'antd';
import { useState, useEffect, useRef } from 'react';
import AddWalletAccount from './components/addWalletAccount';
import { UserWalletAccount } from '@/api/types/userWalletAccount';
import { financeApi } from '@/api/finance';
import { AddWalletAccountRef } from './components/addWalletAccount';
import { PlusOutlined } from '@ant-design/icons';

export default function Page() {
  const [walletAccountList, setWalletAccountList] = useState<
    UserWalletAccount[]
  >([]);
  const [loading, setLoading] = useState(false);
  const Ref_AddWalletAccountRef = useRef<AddWalletAccountRef>(null);

  async function getTaskList() {
    setLoading(true);
    try {
      const res = await financeApi.getUserWalletAccountList();
      setWalletAccountList(res);
    } catch (error) {
      console.error('获取钱包账户列表失败:', error);
      message.error('获取钱包账户列表失败');
    } finally {
      setLoading(false);
    }
  }

  // 新建
  async function createUserWalletAccount() {
    Ref_AddWalletAccountRef.current?.init();
  }

  useEffect(() => {
    getTaskList();
  }, []);

  const columns = [
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },

    {
      title: '真实姓名',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '身份证号',
      dataIndex: 'cardNum',
      key: 'cardNum',
    },
    {
      title: '备注名',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: '账号类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'ZFB' ? 'blue' : 'green'}>
          {type === 'ZFB' ? '支付宝' : '微信'}
        </Tag>
      ),
    },
    
    // {
    //   title: '操作',
    //   key: 'action',
    //   render: (_: any, record: UserWalletAccount) => (
    //     <Space size="middle">
    //       <Button type="link" onClick={() => handleView(record)}>
    //         查看
    //       </Button>
    //     </Space>
    //   ),
    // },
  ];

  const handleView = (record: UserWalletAccount) => {
    // TODO: 实现查看详情功能
    console.log('查看账户详情:', record);
  };

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={createUserWalletAccount}
        >
          添加账户
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={walletAccountList}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <AddWalletAccount
        ref={Ref_AddWalletAccountRef}
        onSuccess={() => {
          message.success('添加账户成功');
          getTaskList(); // 添加成功后刷新列表
        }}
      />
    </div>
  );
}
