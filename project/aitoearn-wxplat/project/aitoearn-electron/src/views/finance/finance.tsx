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
  QuestionCircleOutlined,
  MoneyCollectOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Segmented, Card, Typography, Space, Row, Col, Tooltip, List, Tag, Button, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import styles from './finance.module.scss';
import { useState, useEffect } from 'react';
import { financeApi } from '@/api/finance';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import { Pagination } from '@/api/types';
import { Task, TaskDataInfo } from 'commont/types/task';
import { PaginationMeta } from '@/api/platform';

const { Title, Text } = Typography;

interface TaskResponse {
  list: UserTask<Task<TaskDataInfo>>[];
  total: number;
  pageSize: number;
  pageNo: number;
}

export default function Page() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [pendingBalance, setPendingBalance] = useState<number>(0);
  const [expectedIncomeList, setExpectedIncomeList] = useState<UserTask<Task<TaskDataInfo>>[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    getBalance();
    getTotalAmountOfDoingTasks();
    getExpectedIncomeList();
    // 默认导航到提现记录界面
    navigate('userWalletRecord', { replace: true });
  }, [pagination.current]);

  const getBalance = async () => {
    try {
      setRefreshing(true);
      const res = await financeApi.getUserWalletInfo();
      // console.log('getBalance','res',res);
      setBalance(res.balance || 0);
    } catch (error) {
      console.error('获取余额失败:', error);
      message.error('获取余额失败');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshBalance = async () => {
    message.loading({ content: '刷新中...', key: 'refreshBalance' });
    await getBalance();
    message.success({ content: '余额已更新', key: 'refreshBalance', duration: 2 });
  };

  const getTotalAmountOfDoingTasks = async () => {
    try {
      const res = await taskApi.getTotalAmountOfDoingTasks();
      setPendingBalance(res || 0);
    } catch (error) {
      console.error('获取待提取余额失败:', error);
    }
  };

  const getExpectedIncomeList = async () => {
    try {
      setLoading(true);
      const params = {
        pageSize: pagination.pageSize,
        pageNo: pagination.current,
        status: UserTaskStatus.APPROVED
      };
      const res = await taskApi.getMineTaskList(params);
      console.log('getExpectedIncomeList','res',res);
      setExpectedIncomeList(res.items || []);
      setPagination(prev => ({
        ...prev,
        ...res.meta
      }));
    } catch (error) {
      console.error('获取预计收入列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.finance}>
      <div className={styles.header}>
        <Card className={styles.balanceCard} bordered={false}>
          <Row align="middle" justify="space-between">
            <Col>
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Text type="secondary" className={styles.balanceLabel}>
                    账户余额
                  </Text>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<SyncOutlined spin={refreshing} />} 
                    onClick={handleRefreshBalance}
                    style={{ marginLeft: 4, padding: '0 4px', color: '#ccc' }}
                  />
                </div>
                <div className="flex items-center">
                  <Title level={2} className={styles.balanceAmount}>
                    ¥{balance.toFixed(2)}
                  </Title>
                  <div className="flex items-center ml-4" 
                  onClick={() => {
                    // navigate('expectedIncome');
                  }}>
                    {/* <Text type="secondary" className="text-sm" style={{ color: '#ccc' }}>
                      预计收益: ¥{pendingBalance.toFixed(2) } 
                    </Text> */}
                    <Tooltip 
                      title="提现打款预计3-7个工作日到账"
                      placement="top"
                    >
                      <QuestionCircleOutlined className="ml-1 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                </div>
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
              // {
              //   label: '预计收入',
              //   value: 'expectedIncome',
              //   icon: <MoneyCollectOutlined />,
              // },
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
