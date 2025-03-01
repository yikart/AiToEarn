/*
 * @Author: nevin
 * @Date: 2025-02-27 20:44:31
 * @LastEditTime: 2025-03-02 00:23:39
 * @LastEditors: nevin
 * @Description: 挂车
 */
import { Button, Modal } from 'antd';
import { Task, TaskStatusName, TaskTypeName } from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';

export interface TaskInfoRef {
  init: (pubRecord: Task) => Promise<void>;
}

const Com = forwardRef<TaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task | null>();

  async function init(inTaskInfo: Task) {
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
              <p>佣金比例：{taskInfo.commission}</p>
              <p>任务奖励金额：{taskInfo.reward}</p>
              <p>任务状态：{TaskStatusName.get(taskInfo.status)}</p>
              <p>任务要求：{taskInfo.requirements}</p>
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
