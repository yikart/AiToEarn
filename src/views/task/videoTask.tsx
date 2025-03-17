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
import VideoPlayer from '@/components/VideoPlayer';

// 导入平台图标
import KwaiIcon from '@/assets/svgs/account/ks.svg';
import WxSphIcon from '@/assets/svgs/account/wx-sph.svg';
import XhsIcon from '@/assets/svgs/account/xhs.svg';
import DouyinIcon from '@/assets/svgs/account/douyin.svg';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

// 平台类型映射
const PLATFORM_MAP = {
  KWAI: { name: '快手', color: '#FF5000', icon: KwaiIcon },
  wxSph: { name: '视频号', color: '#FA9A32', icon: WxSphIcon },
  xhs: { name: '小红书', color: '#fe2c55', icon: XhsIcon },
  douyin: { name: '抖音', color: '#000000', icon: DouyinIcon },
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

  // 添加视频播放状态
  const [videoPlayback, setVideoPlayback] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });

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

  // 渲染平台图标
  const renderPlatformTags = (accountTypes?: string[]) => {
    if (!accountTypes || accountTypes.length === 0) {
      return <Tag color="#f50">全平台</Tag>;
    }

    return (
      <div className={styles.platformIcons}>
        {accountTypes.map((type) => {
          const platform = (PLATFORM_MAP as any)[type];
          if (!platform) return null;
          
          return (
            <Tooltip key={type} title={platform.name}>
              <div className={styles.platformIconWrapper} style={{ backgroundColor: platform.color }}>
                <img src={platform.icon} className={styles.platformIcon} alt={platform.name} />
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  // 打开视频播放器
  const openVideoPlayer = (task: Task<TaskVideo>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.dataInfo?.videoUrl) {
      setVideoPlayback({
        visible: true,
        url: `${FILE_BASE_URL}${task.dataInfo.videoUrl}`,
        title: task.title || '视频播放',
      });
    } else {
      message.info('该任务暂无视频');
    }
  };
  
  // 关闭视频播放器
  const closeVideoPlayer = () => {
    setVideoPlayback((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className={styles.videoTaskContainer}>
      <TaskInfo ref={Ref_TaskInfo} />
      
      {/* 添加视频播放组件 */}
      <VideoPlayer
        videoUrl={videoPlayback.url}
        visible={videoPlayback.visible}
        onClose={closeVideoPlayer}
        title={videoPlayback.title}
      />

      <div className={styles.taskList}>
        {taskList.map((task) => (
          <Card
            key={task._id}
            className={styles.taskCard}
            styles={{ body: { padding: 0 } }}
          >
            <div className={styles.taskCardContent}>
              <div 
                className={styles.taskImageContainer}
                onClick={(e) => openVideoPlayer(task, e)}
              >
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
                          onClick={(e) => copyTaskId(task._id, e)}
                        />
                      </Tooltip>
                    </span>
                  </h3>
                  <Tag color="#a66ae4" className={styles.taskTag}>
                    {(task.dataInfo as any)?.type || '视频任务'}
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
