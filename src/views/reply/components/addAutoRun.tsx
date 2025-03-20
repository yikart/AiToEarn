/*
 * @Author: nevin
 * @Date: 2025-03-18 21:02:38
 * @LastEditTime: 2025-03-20 20:38:47
 * @LastEditors: nevin
 * @Description: 添加自动运行
 */
import { ipcCreateAutoRunOfReply } from '@/icp/reply';
import { Button, Input, Modal } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';

export interface AddAutoRunRef {
  init: (accountId: number, dataId: string) => Promise<void>;
}

const Com = forwardRef<AddAutoRunRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountId, setAccountId] = useState<number>(0);
  const [dataId, setDataId] = useState<string>('');
  // '周期类型 天 day-22 (例:每天22时) 周 week-2 (例:每周周二,周日0) 月 month-22 (例:每月22号)',
  const [cycleType, setCycleType] = useState<string>('');
  async function init(accountId: number, dataId: string) {
    setAccountId(accountId);
    setDataId(dataId);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  function handleCancel() {
    setIsModalOpen(false);
  }

  async function onFinish() {
    console.log('-------- accountId', accountId);
    console.log('-------- dataId', dataId);
    console.log('-------- cycleType', cycleType);

    const res = await ipcCreateAutoRunOfReply(accountId, dataId, cycleType);
    console.log('-------- res', res);
  }

  return (
    <>
      <Modal
        title="创建自动回复评论任务"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <p>账号ID{accountId}</p>
        <p>账号ID{accountId}</p>
        <p>
          周期类型 天 day-22 例:每天22时 周 week-2 例:每周周二,周日0 月 month-22
          例:每月22号
        </p>

        <Input
          onChange={(e) => {
            setCycleType(e.target.value);
          }}
        />

        <Button type="primary" onClick={onFinish}>
          创建
        </Button>
      </Modal>
    </>
  );
});
export default Com;
