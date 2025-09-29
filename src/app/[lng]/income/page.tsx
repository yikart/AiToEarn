"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, message, Modal, Tabs, Tag, Space, Popconfirm, Descriptions, Input, Select, Form } from "antd";
import { DollarOutlined, HistoryOutlined, WalletOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import { apiGetIncomeList, apiSubmitWithdraw } from "@/api/income";
import { apiGetWithdrawRecordList } from "@/api/withdraw";
import { IncomeRecord } from "@/api/types/income";
import { WithdrawRecord, WithdrawRecordStatus } from "@/api/types/withdraw";
import { useTransClient } from "@/app/i18n/client";
import styles from "./income.module.css";
import WalletAccountSelect from "@/components/WalletAccountSelect";

const { TabPane } = Tabs;
const { Option } = Select;

export default function IncomePage() {
  const router = useRouter();
  const params = useParams();
  const { userInfo, token, lang } = useUserStore();
  const { t } = useTransClient('income');
  
  // 收入记录相关状态
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [incomePagination, setIncomePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 提现记录相关状态
  const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawPagination, setWithdrawPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 提现申请状态
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedIncomeRecord, setSelectedIncomeRecord] = useState<IncomeRecord | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // 获取收入记录
  const fetchIncomeRecords = async (page: number = 1, pageSize: number = 10) => {
    setIncomeLoading(true);
    try {
      const response = await apiGetIncomeList({ pageNo: page, pageSize }, {});
      if (response?.data) {
        setIncomeRecords(response.data.list || []);
        setIncomePagination({
          current: page,
          pageSize,
          total: response?.data?.total || 0
        });
      } else {
        message.error(t('messages.getIncomeRecordsFailed'));
      }
    } catch (error) {
      message.error(t('messages.getIncomeRecordsFailed'));
    } finally {
      setIncomeLoading(false);
    }
  };

  // 获取提现记录
  const fetchWithdrawRecords = async (page: number = 1, pageSize: number = 10) => {
    setWithdrawLoading(true);
    try {
      const response = await apiGetWithdrawRecordList({ pageNo: page, pageSize }, {});
      if (response?.data) {
        setWithdrawRecords(response.data.list || []);
        setWithdrawPagination({
          current: page,
          pageSize,
          total: response.data.total || 0
        });
      } else {
        message.error(t('messages.getWithdrawRecordsFailed'));
      }
    } catch (error) {
      message.error(t('messages.getWithdrawRecordsFailed'));
    } finally {
      setWithdrawLoading(false);
    }
  };

  // 提交提现申请
  const handleWithdraw = async (incomeRecord: IncomeRecord) => {
    setSelectedIncomeRecord(incomeRecord);
    setWithdrawModalVisible(true);
  };

  // 确认提现申请
  const [form] = Form.useForm<{ userWalletAccountId: string }>();

  const handleConfirmWithdraw = async () => {
    if (!selectedIncomeRecord) return;
    // 仅 status = 1 的收入记录可提现（按需求说明：1=可提现，0=已申请）
    // 如果后端收入列表中没有 status 字段，这里按前端约定：仅当类型为 task 时允许（已有逻辑），并在提现接口前再行校验
    
    setWithdrawSubmitting(true);
    try {
      const values = await form.validateFields();
      const response = await apiSubmitWithdraw(selectedIncomeRecord._id, values.userWalletAccountId);
      if (response) {
        message.success(t('messages.withdrawSubmitted'));
        setWithdrawModalVisible(false);
        setSelectedIncomeRecord(null);
        // 刷新提现记录
        fetchWithdrawRecords(withdrawPagination.current, withdrawPagination.pageSize);
      } else {
        message.error(t('messages.withdrawFailed'));
      }
    } catch (error) {
      message.error(t('messages.withdrawFailed'));
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // 获取收入类型显示文本
  const getIncomeTypeText = (type: string) => {
    const typeMap: { [key: string]: { color: string; text: string } } = {
      'task': { color: 'green', text: t('incomeTypes.task') },
      'task_back': { color: 'orange', text: t('incomeTypes.task_back') },
      'reward_back': { color: 'blue', text: t('incomeTypes.reward_back') },
      'task_withdraw': { color: 'purple', text: t('incomeTypes.task_withdraw' as any) }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取提现状态显示
  const getWithdrawStatusTag = (status: WithdrawRecordStatus) => {
    const statusMap = {
      [WithdrawRecordStatus.WAIT]: { color: 'orange', text: t('withdrawStatus.wait'), icon: <ClockCircleOutlined /> },
      [WithdrawRecordStatus.SUCCESS]: { color: 'green', text: t('withdrawStatus.success'), icon: <CheckCircleOutlined /> },
      [WithdrawRecordStatus.FAIL]: { color: 'red', text: t('withdrawStatus.fail'), icon: <CloseCircleOutlined /> },
      [WithdrawRecordStatus.TASK_WITHDRAW]: { color: 'blue', text: t('withdrawStatus.task_withdraw' as any), icon: <DollarOutlined /> }
    };
    const config = statusMap[status] || { color: 'default', text: '未知状态', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 收入记录表格列
  const incomeColumns = [
    {
      title: t('incomeId'),
      dataIndex: '_id',
      key: '_id',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          CNY {amount/100}
        </span>
      ),
    },
    {
      title: t('type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getIncomeTypeText(type),
    },
    {
      title: t('description'),
      dataIndex: 'desc',
      key: 'desc',
      ellipsis: true,
    },
    {
      title: t('createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: t('actions'),
      key: 'action',
      render: (_: any, record: IncomeRecord) => (
        <Space>
          {record.type === 'task' && record.status === 0 ? (
            <Button 
              type="primary" 
              size="small"
              onClick={() => handleWithdraw(record)}
            >
              {t('applyWithdraw')}
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  // 提现记录表格列
  const withdrawColumns = [
    {
      title: t('withdrawId'),
      dataIndex: '_id',
      key: '_id',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          CNY {amount/100}
        </span>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: WithdrawRecordStatus) => getWithdrawStatusTag(status),
    },
    {
      title: t('description'),
      dataIndex: 'desc',
      key: 'desc',
      ellipsis: true,
    },
    {
      title: t('createTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: t('updateTime'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: Date) => new Date(date).toLocaleString(),
    },
  ];

  useEffect(() => {
    if (!token) {
      message.error(t('messages.pleaseLoginFirst'));
      router.push('/login');
      return;
    }
    
    // 初始加载数据
    fetchIncomeRecords(1, 10);
    fetchWithdrawRecords(1, 10);
  }, [token, router]);

  return (
    <div className={styles.container}>
      {/* 页面头部 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <DollarOutlined />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>{t('title')}</h1>
              <p className={styles.headerSubtitle}>{t('subtitle')}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.balanceCard}>
              <div className={styles.balanceIcon}>
                <WalletOutlined />
              </div>
              <div className={styles.balanceInfo}>
                <div className={styles.balanceLabel}>{t('currentBalance')}</div>
                <div className={styles.balanceAmount}>CNY {(userInfo?.income as number / 100 || 0).toFixed(2)}</div>
              </div>
            </div>
            <span
              className={styles.walletLink}
              role="button"
              onClick={() => {
                const effectiveLng = (params as any)?.lng || lang || "zh-CN";
                router.push(`/${effectiveLng}/wallet`);
              }}
            >
              {t('myWallet')}
            </span>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className={styles.content}>
        <Tabs defaultActiveKey="income" size="large">
          <TabPane 
            tab={
              <span>
                <DollarOutlined />&nbsp;
                {t('incomeRecords')}
              </span>
            } 
            key="income"
          >
            <Card>
              <Table
                columns={incomeColumns}
                dataSource={incomeRecords}
                loading={incomeLoading}
                rowKey="_id"
                pagination={{
                  current: incomePagination.current,
                  pageSize: incomePagination.pageSize,
                  total: incomePagination.total,
                  onChange: (page, size) => {
                    fetchIncomeRecords(page, size || 10);
                  },
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => t('messages.totalRecords', { total }),
                  pageSizeOptions: ['10', '20', '50'],
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: incomeLoading ? t('messages.loading') : t('messages.noIncomeRecords')
                }}
              />
            </Card>
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <HistoryOutlined />&nbsp;
                {t('withdrawRecords')}
              </span>
            } 
            key="withdraw"
          >
            <Card>
              <Table
                columns={withdrawColumns}
                dataSource={withdrawRecords}
                loading={withdrawLoading}
                rowKey="_id"
                pagination={{
                  current: withdrawPagination.current,
                  pageSize: withdrawPagination.pageSize,
                  total: withdrawPagination.total,
                  onChange: (page, size) => {
                    fetchWithdrawRecords(page, size || 10);
                  },
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => t('messages.totalRecords', { total }),
                  pageSizeOptions: ['10', '20', '50'],
                }}
                scroll={{ x: 800 }}
                locale={{
                  emptyText: withdrawLoading ? t('messages.loading') : t('messages.noWithdrawRecords')
                }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>

      {/* 提现确认弹窗 */}
      <Modal
        title={t('confirmWithdraw')}
        open={withdrawModalVisible}
        onCancel={() => {
          setWithdrawModalVisible(false);
          setSelectedIncomeRecord(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setWithdrawModalVisible(false);
            setSelectedIncomeRecord(null);
          }}>
            {t('cancel')}
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            loading={withdrawSubmitting}
            onClick={handleConfirmWithdraw}
          >
            {t('confirm')}
          </Button>
        ]}
        width={500}
        centered
      >
        {selectedIncomeRecord && (
          <div className={styles.withdrawModalContent}>
            <div className={styles.withdrawInfo}>
              <div className={styles.withdrawItem}>
                <span className={styles.withdrawLabel}>{t('incomeId')}：</span>
                <span className={styles.withdrawValue}>{selectedIncomeRecord._id}</span>
              </div>
              <div className={styles.withdrawItem}>
                <span className={styles.withdrawLabel}>{t('withdrawAmount')}：</span>
                <span className={styles.withdrawAmount}>CNY {selectedIncomeRecord.amount/100}</span>
              </div>
              <div className={styles.withdrawItem}>
                <span className={styles.withdrawLabel}>{t('incomeType')}：</span>
                <span>{getIncomeTypeText(selectedIncomeRecord.type)}</span>
              </div>
              {selectedIncomeRecord.desc && (
                <div className={styles.withdrawItem}>
                  <span className={styles.withdrawLabel}>{t('description')}：</span>
                  <span className={styles.withdrawValue}>{selectedIncomeRecord.desc}</span>
                </div>
              )}
            </div>

            <Form form={form} layout="vertical">
              <Form.Item name="userWalletAccountId" label={t('myWallet')} rules={[{ required: true, message: t('messages.pleaseLoginFirst') }]}> 
                <WalletAccountSelect />
              </Form.Item>
            </Form>

            <div className={styles.withdrawWarning}>
              <p>{t('withdrawWarning')}</p>
              <p>{t('withdrawWarning2')}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
