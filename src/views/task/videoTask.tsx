/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 00:17:11
 * @LastEditors: nevin
 * @Description: 视频任务
 */
import { Button } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { Task, TaskType } from '@@/types/task';
import { taskApi } from '@/api/task';
import { TaskInfoRef } from './components/popInfo';
import TaskInfo from './components/videoInfo';
export default function Page() {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList() {
    const res = await taskApi.getTaskList({
      ...pageInfo,
      type: TaskType.VIDEO,
    });
    setTaskList(res.items);
  }

  useEffect(() => {
    getTaskList();
  }, []);

  return (
    <div>
      <TaskInfo ref={Ref_TaskInfo} />
      <div>
        {taskList.map((v) => {
          return (
            <div key={v.id}>
              {v.title}
              <Button
                type="primary"
                onClick={() => Ref_TaskInfo.current?.init(v)}
              >
                查看
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
