/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 00:16:00
 * @LastEditors: nevin
 * @Description: 任务
 */
import { Button, Card, Col, Row } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { Task, TaskProduct, TaskType } from '@@/types/task';
import { taskApi } from '@/api/task';
import { TaskInfoRef } from './components/popInfo';
import TaskInfo from './components/carInfo';
const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export default function Page() {
  const [taskList, setTaskList] = useState<Task<TaskProduct>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList() {
    const res = await taskApi.getTaskList({
      ...pageInfo,
      type: TaskType.PRODUCT,
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
                          <p> {v.dataInfo.price}元</p>
                          <p>数量: {v.dataInfo.sales}</p>
                        </>
                      )}
                    </Col>
                    <Col span={12}>
                      <p>招募人数: {v.maxRecruits}</p>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row>
                <Row>
                  <Col span={12}>
                    是否已经接受: {v.isAccepted ? '是' : '否'}
                  </Col>
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
