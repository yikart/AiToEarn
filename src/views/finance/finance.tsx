/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:42:15
 * @LastEditors: nevin
 * @Description: 钱包页面
 */
import {
  VideoCameraOutlined,
  WalletOutlined,
  HistoryOutlined,
  AccountBookOutlined,
} from '@ant-design/icons';
import { Segmented, Card, Typography, Space, Row, Col } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import styles from './finance.module.scss';
import { useState, useEffect } from 'react';
import { financeApi } from '@/api/finance';
import { taskApi } from '@/api/task';

const { Title, Text } = Typography;

export default function Page() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    getBalance();
    getTotalAmountOfDoingTasks();
    // 默认导航到提现记录界面
    navigate('userWalletRecord', { replace: true });
  }, []);

  const getBalance = async () => {
    try {
      const res = await financeApi.getUserWalletInfo();
      // console.log('getBalance','res',res);
      setBalance(res.balance || 0);
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  const getTotalAmountOfDoingTasks = async () => {
    try {
      const res = await taskApi.getTotalAmountOfDoingTasks();
      console.log('getTotalAmountOfDoingTasks ---------', res);
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  return (
    <div className={styles.finance}>
      <div className={styles.header}>
        <Card className={styles.balanceCard} bordered={false}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space direction="vertical" size="small">
                <Text type="secondary" className={styles.balanceLabel}>
                  账户余额
                </Text>
                <Title level={2} className={styles.balanceAmount}>
                  ¥{balance.toFixed(2)}
                </Title>
              </Space>
            </Col>
            <Col>
              <WalletOutlined className={styles.walletIcon} />
            </Col>
          </Row>
        </Card>
      </div>
      <div className={styles.content}>
        <div className={styles.sidebar}>
          <Segmented
            vertical
            size="large"
            options={[
              {
                label: '提现记录',
                value: 'userWalletRecord',
                icon: <HistoryOutlined />,
              },
              {
                label: '钱包账户',
                value: 'userWalletAccount',
                icon: <AccountBookOutlined />,
              },
            ]}
            onChange={(value) => {
              navigate(value);
            }}
            className={styles.segmented}
          />
        </div>
        <div className={styles.outlet}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
