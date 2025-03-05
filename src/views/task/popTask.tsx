/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 00:15:35
 * @LastEditors: nevin
 * @Description: 推广任务
 */
import { Button, Card, Col, Row } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { Task, TaskPromotion, TaskType } from '@@/types/task';
import { taskApi } from '@/api/task';
import { TaskInfoRef } from './components/popInfo';
import TaskInfo from './components/popInfo';
const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export default function Page() {
  const [taskList, setTaskList] = useState<Task<TaskPromotion>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList() {
    const res = await taskApi.getTaskList({
      ...pageInfo,
      type: TaskType.PROMOTION,
    });
    setTaskList(res.items);
  }

  useEffect(() => {
    getTaskList();
  }, []);

  return (
    <div className="p-4">
      <TaskInfo ref={Ref_TaskInfo} />
      <div className="flex flex-wrap gap-4">
        {taskList.map((v) => {
          return (
            <Card
              key={v.id}
              className="box-border w-full p-4 sm:w-1/2 md:w-1/3"
            >
              <Row>
                <Col span={12}>
                  <div>
                    <img
                      src={`${FILE_BASE_URL}${v.imageUrl}`}
                      alt=""
                      className="w-full h-full"
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <h3>{v.title}</h3>
                  <Row>
                    <Col span={12}>
                      {!v.dataInfo ? (
                        <div>暂无数据</div>
                      ) : (
                        <>
                          <p> {v.dataInfo.title}</p>
                        </>
                      )}
                    </Col>
                    <Col span={12}>
                      <p>招募人数: {v.maxRecruits}</p>
                      <p>截至日期: {v.deadline}</p>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row>
                <Row>
                  <Col span={12}>-----</Col>
                  <Col span={12}>
                    <Button
                      type="primary"
                      onClick={() => Ref_TaskInfo.current?.init(v)}
                    >
                      查看
                    </Button>
                  </Col>
                </Row>
              </Row>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
