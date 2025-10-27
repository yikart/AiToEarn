/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-25 13:41:14
 * @LastEditors: nevin
 * @Description: 添加自动运行
 */
import { ipcCreateAutoRunOfReply, WorkData } from '@/icp/reply';
import { Modal } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { CronSchedule } from '@/components/CronSchedule';

export interface AddAutoRunRef {
  init: (accountId: number, data: WorkData) => Promise<void>;
}

const Com = forwardRef<AddAutoRunRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [workData, setWorkData] = useState<WorkData | null>(null);

  // '周期类型 天 day-22 (例:每天22时) 周 week-2 (例:每周周二,周日0) 月 month-22 (例:每月22号)',
  const [cycleType, setCycleType] = useState<string>('');
  async function init(accountId: number, data: WorkData) {
    setAccountId(accountId);
    setWorkData(data);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setIsModalOpen(false);
  }

  async function handleCron(cron: string) {
    console.log('生成的定时表达式:----', cron);
    if (!workData) return;

    setCycleType(cron);
    const res = await ipcCreateAutoRunOfReply(accountId, workData, cron);
    console.log('-------- res', res);
  }

  return (
    <>
      <Modal
        title="创建自动回复评论任务"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <CronSchedule onSubmit={handleCron} />
      </Modal>
    </>
  );
});
export default Com;
