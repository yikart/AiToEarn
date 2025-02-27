/*
 * @Author: nevin
 * @Date: 2025-02-27 19:37:08
 * @LastEditTime: 2025-02-27 20:39:21
 * @LastEditors: nevin
 * @Description: 我的任务列表
 */
import { Button } from 'antd';
import { useState, useEffect } from 'react';
import { taskApi } from '@/api/task';
import { UserTask } from '@/api/types/task';

export default function Page() {
  const [taskList, setTaskList] = useState<UserTask[]>([]);
  const [taskDetails, setTaskDetails] = useState<Record<string, any>>({});
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });

  async function getTaskInfo(task: UserTask) {
    const res = await taskApi.getTaskInfo(task.taskId);
    return res;
  }

  useEffect(() => {
    const fetchTaskDetails = async () => {
      const tasks = await taskApi.getMineTaskList(pageInfo);
      setTaskList(tasks.items);

      const detailsPromises = tasks.items.map((task) => getTaskInfo(task));
      const details = await Promise.all(detailsPromises);

      const detailsMap: Record<string, any> = {};
      details.forEach((detail, index) => {
        detailsMap[tasks.items[index].taskId] = detail;
      });

      setTaskDetails(detailsMap);
    };

    fetchTaskDetails();
  }, []);

  return (
    <div>
      <div>
        {taskList.map((v) => {
          const detail = taskDetails[v.taskId];
          return (
            <div key={v.id}>
              {v.taskId}
              <Button type="primary">提现</Button>
              {/* 渲染任务详细信息 */}
              {detail && (
                <div>
                  <p>任务名称: {detail.name}</p>
                  <p>任务描述: {detail.description}</p>
                  {/* 其他详细信息 */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
