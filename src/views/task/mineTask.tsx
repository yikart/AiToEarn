/*
 * @Author: nevin
 * @Date: 2025-02-27 19:37:08
 * @LastEditTime: 2025-03-02 22:40:53
 * @LastEditors: nevin
 * @Description: 我的任务列表
 */
import { Button, Card } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import { Task, TaskDataInfo } from '@@/types/task';
import MineTaskInfo, { MineTaskInfoRef } from './components/mineInfo';
import { WithdrawRef } from './components/withdraw';
import Withdraw from './components/withdraw';

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
  const [taskList, setTaskList] = useState<UserTask<Task<TaskDataInfo>>[]>([]);
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
  const Ref_Withdraw = useRef<WithdrawRef>(null);

  async function withdraw(task: UserTask<Task<TaskDataInfo>>) {
    Ref_Withdraw.current?.init(task);
  }

  return (
    <div className="p-4">
      <MineTaskInfo ref={Ref_MineTaskInfo} />
      <Withdraw ref={Ref_Withdraw} />
      <div className="flex flex-wrap gap-4">
        {taskList.map((v) => {
          return (
            <Card
              key={v.id}
              title={v.taskId.title}
              className="box-border w-full p-4 sm:w-1/2 md:w-1/3"
            >
              <div>
                <p>任务描述: {v.taskId.description}</p>
                <p>状态: {UserTaskStatusNameMap.get(v.status)}</p>
                <p>接受时间: {v.createTime}</p>
                <p>提交时间: {v.submissionTime}</p>
                <p>完成时间: {v.rewardTime}</p>
              </div>
              <div>
                {v.status === UserTaskStatus.DODING && (
                  <Button
                    type="primary"
                    onClick={() => Ref_MineTaskInfo.current?.init(v)}
                  >
                    去完成
                  </Button>
                )}

                {v.status === UserTaskStatus.APPROVED && (
                  <Button type="primary" onClick={() => withdraw(v)}>
                    提现
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
