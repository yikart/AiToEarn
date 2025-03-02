/*
 * @Author: nevin
 * @Date: 2025-02-27 19:37:08
 * @LastEditTime: 2025-03-02 13:52:29
 * @LastEditors: nevin
 * @Description: 我的任务列表
 */
import { Button } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import { Task } from '@@/types/task';
import MineTaskInfo, { MineTaskInfoRef } from './components/mineInfo';

const UserTaskStatusNameMap = new Map<UserTaskStatus, string>([
  [UserTaskStatus.DODING, '进行中'],
  [UserTaskStatus.PENDING, '待审核'],
  [UserTaskStatus.APPROVED, '已通过'],
  [UserTaskStatus.REJECTED, '已拒绝'],
  [UserTaskStatus.COMPLETED, '已完成'],
  [UserTaskStatus.CANCELLED, '已取消'],
  [UserTaskStatus.PENDING_REWARD, '待发放奖励'],
  [UserTaskStatus.REWARDED, '已发放奖励'],
]);

export default function Page() {
  const [taskList, setTaskList] = useState<UserTask<Task>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });

  useEffect(() => {
    const fetchTaskDetails = async () => {
      const tasks = await taskApi.getMineTaskList(pageInfo);

      setTaskList(tasks.items);
    };

    fetchTaskDetails();
  }, []);

  const Ref_MineTaskInfo = useRef<MineTaskInfoRef>(null);

  return (
    <div>
      <MineTaskInfo ref={Ref_MineTaskInfo} />
      <div>
        {taskList.map((v) => {
          return (
            <div key={v.id}>
              {v.taskId.id}
              <div>
                <p>任务名称: {v.taskId.title}</p>
                <p>任务描述: {v.taskId.description}</p>
                <p>状态: {UserTaskStatusNameMap.get(v.status)}</p>
                <p>接受时间: {v.createTime}</p>
                <p>提交时间: {v.submissionTime}</p>
                <p>完成时间: {v.rewardTime}</p>
              </div>
              <Button
                type="primary"
                onClick={() => Ref_MineTaskInfo.current?.init(v)}
              >
                去完成
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
