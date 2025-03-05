/*
 * @Author: nevin
 * @Date: 2025-02-27 20:44:31
 * @LastEditTime: 2025-03-03 18:04:32
 * @LastEditors: nevin
 * @Description: 挂车
 */
import { Button, Modal } from 'antd';
import {
  Task,
  TaskPromotion,
  TaskStatusName,
  TaskTypeName,
} from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskPromotion>) => Promise<void>;
}

const Com = forwardRef<TaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskPromotion> | null>();

  async function init(inTaskInfo: Task<TaskPromotion>) {
    setTaskInfo(inTaskInfo);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  /**
   * 接受任务
   */
  async function taskApply() {
    if (!taskInfo) return;

    const res = await taskApi.taskApply(taskInfo?.id);
    setTaskInfo(res);
    setIsModalOpen(false);
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Modal
        title="Basic Modal"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={taskApply}>
            报名
          </Button>,
        ]}
      >
        <div>
          {taskInfo ? (
            <div>
              <p>任务标题：{taskInfo.title}</p>
              <p>任务描述：{taskInfo.description}</p>
              <p>任务类型：{TaskTypeName.get(taskInfo.type)}</p>
              <p>任务图片：{taskInfo.imageUrl}</p>
              <p>任务奖励金额：{taskInfo.reward}</p>
              <p>任务状态：{TaskStatusName.get(taskInfo.status)}</p>
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
