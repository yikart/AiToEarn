/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:05:09
 * @LastEditors: nevin
 * @Description: 用户任务信息
 */
import { Button, Modal } from 'antd';
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

export interface MineTaskInfoRef {
  init: (
    inData: UserTask<Task<TaskProduct | TaskPromotion | TaskVideo>>,
  ) => Promise<void>;
}

const Com = forwardRef<MineTaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mineTaskInfo, setMineTaskInfo] = useState<UserTask<
    Task<TaskProduct | TaskPromotion | TaskVideo>
  > | null>();
  const [doneInfo, setDoneInfo] = useState<{
    submissionUrl?: string;
    qrCodeScanResult?: string;
    screenshotUrls?: string[];
  }>({
    submissionUrl: 'http://1112',
    qrCodeScanResult: 'http://wewqe',
    screenshotUrls: ['img1', 'img2'],
  });

  async function init(
    inData: UserTask<Task<TaskProduct | TaskPromotion | TaskVideo>>,
  ) {
    setMineTaskInfo(inData);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  async function taskDone() {
    if (!mineTaskInfo) return;
    const res = await taskApi.taskDone(mineTaskInfo.id, doneInfo);
    setMineTaskInfo({
      ...mineTaskInfo,
      status: res.status, // 更新为待审核
    });
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        title="我的任务"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={taskDone}>
            提交
          </Button>,
        ]}
      >
        <div>
          {mineTaskInfo ? (
            <div>
              <p>任务标题：{mineTaskInfo.taskId.title}</p>
              <p>任务描述：{mineTaskInfo.taskId.description}</p>
              <p>任务类型：{TaskTypeName.get(mineTaskInfo.taskId.type)}</p>
              <p>任务图片：{mineTaskInfo.taskId.imageUrl}</p>
            </div>
          ) : (
            <div>暂无任务信息</div>
          )}
        </div>
        <div>
          <h2>完成任务信息：</h2>
          <p>结果URL:{doneInfo.submissionUrl}</p>
          <p>结果URL:{doneInfo.qrCodeScanResult}</p>
          <p>完成截图列表:{doneInfo.screenshotUrls}</p>
        </div>
      </Modal>
    </>
  );
});

export default Com;
