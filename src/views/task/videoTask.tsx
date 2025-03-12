/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 00:17:11
 * @LastEditors: nevin
 * @Description: 视频任务
 */
import { Button, Card, Tag, Spin, message, Tooltip } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { Task, TaskType, TaskVideo } from '@@/types/task';
import { taskApi } from '@/api/task';
import { TaskInfoRef } from './components/popInfo';
import TaskInfo from './components/videoInfo';
import styles from './videoTask.module.scss';
import {
  ClockCircleOutlined,
  TeamOutlined,
  RightOutlined,
  PlayCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

// 平台类型映射
const PLATFORM_MAP = {
  KWAI: { name: '快手', color: '#00bbf0' },
  wxSph: { name: '视频号', color: '#07c160' },
  xhs: { name: '小红书', color: '#fe2c55' },
  douyin: { name: '抖音', color: '#000000' },
};

export default function Page() {
  const [taskList, setTaskList] = useState<Task<TaskVideo>[]>([]);
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
      const res = await taskApi.getTaskList<TaskVideo>({
        ...pageInfo,
        type: TaskType.VIDEO,
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
  const formatDate = (dateString?: string) => {
    if (!dateString) return '2025/03/17';
    return dayjs(dateString).format('YYYY/MM/DD');
  };

  // 复制任务ID
  const copyTaskId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      .writeText(id)
      .then(() => {
        message.success('任务ID已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 渲染平台标签
  const renderPlatformTags = (accountTypes?: string[]) => {
    if (!accountTypes || accountTypes.length === 0) {
      return <Tag color="#f50">全平台</Tag>;
    }

    return (
      <div className={styles.platformTags}>
        {accountTypes.map((type) => (
          <Tag key={type} color={PLATFORM_MAP[type]?.color || '#f50'}>
            {PLATFORM_MAP[type]?.name || type}
          </Tag>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.videoTaskContainer}>
      <TaskInfo ref={Ref_TaskInfo} />

      <div className={styles.taskList}>
        {taskList.map((task) => (
          <Card
            key={task.id}
            className={styles.taskCard}
            bodyStyle={{ padding: 0 }}
          >
            <div className={styles.taskCardContent}>
              <div className={styles.taskImageContainer}>
                <img
                  src={`${FILE_BASE_URL}${task.imageUrl}`}
                  alt={task.title}
                  className={styles.taskImage}
                />
                <div className={styles.videoOverlay}>
                  <PlayCircleOutlined className={styles.playIcon} />
                </div>
              </div>

              <div className={styles.taskInfo}>
                <div className={styles.taskHeader}>
                  <h3 className={styles.taskTitle}>
                    {task.title}
                    <span className={styles.taskId}>
                      ID: {task.id}
                      <Tooltip title="复制任务ID">
                        <CopyOutlined
                          className={styles.copyIcon}
                          onClick={(e) => copyTaskId(task.id, e)}
                        />
                      </Tooltip>
                    </span>
                  </h3>
                  <Tag color="#f50" className={styles.taskTag}>
                    {task.dataInfo?.type || '视频任务'}
                  </Tag>
                </div>

                <div
                  className={styles.taskDescription}
                  dangerouslySetInnerHTML={{
                    __html: task.description || '不许删文',
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
                    {task.requirement || '不许删文'}
                  </span>
                </div>

                <div className={styles.platformContainer}>
                  <span className={styles.platformLabel}>可用平台:</span>
                  {renderPlatformTags(task.accountTypes)}
                </div>
              </div>

              <div className={styles.taskAction}>
                <div className={styles.taskStatus}>
                  <Tag color="#87d068">进行中</Tag>
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
