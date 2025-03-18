/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 00:15:35
 * @LastEditors: nevin
 * @Description: 推广任务
 */
import { Button, Card, Tag, Spin, message, Tooltip } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { Task, TaskPromotion, TaskType } from '@@/types/task';
import { taskApi } from '@/api/task';
import { TaskInfoRef } from './components/popInfo';
import TaskInfo from './components/popInfo';
import styles from './popTask.module.scss';
import {
  ClockCircleOutlined,
  TeamOutlined,
  RightOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export default function Page() {
  const [taskList, setTaskList] = useState<Task<TaskPromotion>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList(isLoadMore = false) {
    setLoading(true);
    try {
      const res = await taskApi.getTaskList({
        ...pageInfo,
        type: TaskType.PROMOTION,
      });

      if (isLoadMore) {
        setTaskList((prev) => [...prev, ...res.items]);
      } else {
        setTaskList(res.items);
      }

      setPageInfo((prev) => ({
        ...prev,
        totalCount: (res as any).totalCount, 
      }));

      // 检查是否还有更多数据
      setHasMore(pageInfo.pageNo * pageInfo.pageSize < (res as any).totalCount);
    } catch (error) {
      console.error('获取任务列表失败', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getTaskList();
  }, []);

  // 加载更多数据
  const loadMore = () => {
    setPageInfo((prev) => ({
      ...prev,
      pageNo: prev.pageNo + 1,
    }));
    getTaskList(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '2025/03/17';
    return dayjs(dateString).format('YYYY/MM/DD');
  };

  // 复制任务ID
  const copyTaskId = (id: string) => {
    navigator.clipboard
      .writeText(id)
      .then(() => {
        message.success('任务ID已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 刷新任务列表的函数
  const refreshTaskList = () => {
    setPageInfo({
      pageSize: 10,
      pageNo: 1,
      totalCount: 0,
    });
    getTaskList();
  };

  return (
    <div className={styles.popTaskContainer}>
      <TaskInfo ref={Ref_TaskInfo} onTaskApplied={refreshTaskList} />

      <div className={styles.taskList}>
        {taskList.map((task) => (
          <Card key={task._id} className={styles.taskCard}>
            <div className={styles.taskCardContent}>
              <div className={styles.taskImageContainer}>
                <img
                  src={`${FILE_BASE_URL}${task.imageUrl}`}
                  alt={task.title}
                  className={styles.taskImage}
                />
              </div>

              <div className={styles.taskInfo}>
                <div className={styles.taskHeader}>
                  <h3 className={styles.taskTitle}>
                    {task.title}
                    <span className={styles.taskId}>
                      ID: {task._id}
                      <Tooltip title="复制任务ID">
                        <CopyOutlined
                          className={styles.copyIcon}
                          onClick={() => copyTaskId(task._id)}
                        />
                      </Tooltip>
                    </span>
                  </h3>
                  <Tag color="#a66ae4" className={styles.taskTag}>
                    {(task.dataInfo as any)?.type || '推广APP'}
                  </Tag>
                </div>

                <div
                  className={styles.taskDescription}
                  dangerouslySetInnerHTML={{
                    __html: task.description || '扫二维码下载APP并完成注册任务',
                  }}
                />

                <div className={styles.taskDetails}>
                  <div className={styles.taskDetail}>
                    <ClockCircleOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>截止时间:</span>
                    <span className={styles.detailValue}>
                      {formatDate(task.deadline)}
                    </span>
                  </div>

                  <div className={styles.taskDetail}>
                    <TeamOutlined className={styles.detailIcon} />
                    <span className={styles.detailLabel}>招募人数:</span>
                    <span className={styles.detailValue}>
                      {task.maxRecruits || 100}
                    </span>
                  </div>
                </div>

                <div className={styles.taskRequirement}>
                  <span className={styles.requirementLabel}>任务要求:</span>
                  <span className={styles.requirementValue}>
                    {task.requirement || '扫二维码'}
                  </span>
                </div>
              </div>

              <div className={styles.taskAction}>
                <div className={styles.taskStatus}>
                  <Tag color="#a66ae4">进行中</Tag>
                </div>

                <div className={styles.taskReward}>
                  <span className={styles.rewardLabel}>每篇可赚</span>
                  <span className={styles.rewardValue}>
                    ¥{task.reward || 5}
                  </span>
                </div>

                <Button
                  type="primary"
                  className={styles.viewButton}
                  onClick={() => Ref_TaskInfo.current?.init(task)}
                  style={{ backgroundColor: '#a66ae4' }}
                >
                  去查看 <RightOutlined />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {loading && (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
          </div>
        )}

        {!loading && hasMore && (
          <div className={styles.loadMoreContainer}>
            <Button onClick={loadMore}>查看更多任务</Button>
          </div>
        )}
      </div>
    </div>
  );
}
