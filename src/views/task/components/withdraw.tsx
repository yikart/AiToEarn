/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:06:49
 * @LastEditors: nevin
 * @Description: 任务提现
 */
import { Button, Modal, Card, Typography, Space, message, Tag } from 'antd';
import {
  Task,
  TaskProduct,
  TaskPromotion,
  TaskTypeName,
  TaskVideo,
} from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import { UserTask } from '@/api/types/task';

export interface WithdrawRef {
  init: (
    taskInfo: UserTask<Task<TaskProduct | TaskPromotion | TaskVideo>>,
  ) => Promise<void>;
}

const Com = forwardRef<WithdrawRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<UserTask<
    Task<TaskProduct | TaskPromotion | TaskVideo>
  > | null>();
  const [loading, setLoading] = useState(false);
  
  const { Title, Text, Paragraph } = Typography;

  async function init(
    inTaskInfo: UserTask<Task<TaskProduct | TaskPromotion | TaskVideo>>,
  ) {
    setTaskInfo(inTaskInfo);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  /**
   * 提交提现申请
   */
  async function submitWithdraw() {
    if (!taskInfo) return;

    setLoading(true);
    try {
      const res = await taskApi.withdraw(taskInfo.id);
      message.success('提现申请已提交');
      setIsModalOpen(false);
    } catch (error) {
      message.error('提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 获取任务支持的账户类型标签
  const renderAccountTypeTags = () => {
    const accountTypes = taskInfo?.taskId.accountTypes || [];
    if (accountTypes.length === 0) return null;
    
    return (
      <Space size={[0, 8]} wrap>
        <Text style={{ marginRight: 8 }}>支持账户类型：</Text>
        {accountTypes.map(type => (
          <Tag color="blue" key={type}>
            {type.toUpperCase()}
          </Tag>
        ))}
      </Space>
    );
  };

  return (
    <>
      <Modal
        title={<Title level={4}>任务提现申请</Title>}
        open={isModalOpen}
        onCancel={handleCancel}
        width={500}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={submitWithdraw} 
            loading={loading}
          >
            提交申请
          </Button>,
        ]}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 提现金额信息卡片 */}
          <Card 
            style={{ 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px'
            }}
          >
            <Space direction="vertical" size="small">
              <Text>任务标题：{taskInfo?.taskId.title || '暂无'}</Text>
              <Space>
                <Text>提现金额：</Text>
                <Text style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#1890ff' 
                }}>
                  ¥{taskInfo?.taskId.reward || 0}
                </Text>
              </Space>
              <Text type="secondary">
                任务类型：{taskInfo?.taskId.type ? TaskTypeName.get(taskInfo.taskId.type) : '暂无'}
              </Text>
              {taskInfo?.verificationNote && (
                <Paragraph type="secondary" style={{ marginTop: 8 }}>
                  审核备注：{taskInfo.verificationNote}
                </Paragraph>
              )}
            </Space>
          </Card>

          {/* 提现说明 */}
          <Card>
            <Space direction="vertical">
              <Text strong>提现说明</Text>
              <Text type="secondary">
                1. 提交申请后，系统将审核您的资金情况
              </Text>
              <Text type="secondary">
                2. 审核通过后，奖励将自动发放到您的账户钱包
              </Text>
              <Text type="secondary">
                3. 账户钱包余额可提现到支付宝
              </Text>
            </Space>
          </Card>
        </Space>
      </Modal>
    </>
  );
});

export default Com;
