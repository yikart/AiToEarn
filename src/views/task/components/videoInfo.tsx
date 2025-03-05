/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:05:59
 * @LastEditors: nevin
 * @Description: video
 */
import { Button, Modal } from 'antd';
import { Task, TaskStatusName, TaskTypeName, TaskVideo } from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskVideo>) => Promise<void>;
}

const Com = forwardRef<TaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskVideo> | null>();

  async function init(inTaskInfo: Task<TaskVideo>) {
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

    const res = await taskApi.taskApply<TaskVideo>(taskInfo?.id);
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
            接受
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
