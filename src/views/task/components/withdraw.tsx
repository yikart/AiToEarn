/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:06:49
 * @LastEditors: nevin
 * @Description: 任务提现
 */
import { Button, Modal } from 'antd';
import { Task, TaskTypeName } from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import { financeApi } from '@/api/finance';
import { UserWalletAccount } from '@/api/types/userWalletAccount';
import { UserTask } from '@/api/types/task';

export interface WithdrawRef {
  init: (taskInfo: UserTask<Task>) => Promise<void>;
}

const Com = forwardRef<WithdrawRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountList, setAccountList] = useState<UserWalletAccount[]>([]);
  const [account, setAccount] = useState<UserWalletAccount | null>();
  const [taskInfo, setTaskInfo] = useState<UserTask<Task> | null>();

  async function init(inTaskInfo: UserTask<Task>) {
    await getAccountList();
    setTaskInfo(inTaskInfo);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  async function getAccountList() {
    if (!taskInfo) return;

    const res = await financeApi.getUserWalletAccountList();

    setAccountList(res);
    setIsModalOpen(false);
  }

  /**
   * 接受任务
   */
  async function withdraw() {
    if (!taskInfo || !account) return;

    const res = await taskApi.withdraw(taskInfo.id, account.id);
    setIsModalOpen(false);
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        title="任务提现"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={withdraw}>
            提现
          </Button>,
        ]}
      >
        <div>
          <div>
            <p>钱包列表：</p>
            {accountList.map((item) => (
              <div key={item.id}>
                <p>手机号：{item.phone}</p>
                <p>账户号：{item.account}</p>
                <p>钱包类型：{item.type}</p>
                <Button type="primary" onClick={() => setAccount(item)}>
                  选择
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          {taskInfo ? (
            <div>
              <p>任务标题：{taskInfo.taskId.title}</p>
              <p>任务描述：{taskInfo.taskId.description}</p>
              <p>任务类型：{TaskTypeName.get(taskInfo.taskId.type)}</p>
              <p>任务图片：{taskInfo.taskId.imageUrl}</p>
              <p>任务奖励金额：{taskInfo.taskId.reward}</p>
            </div>
          ) : (
            <div>暂无任务信息</div>
          )}
        </div>
      </Modal>
    </>
  );
});

export default Com;
