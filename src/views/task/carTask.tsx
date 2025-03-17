/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 00:16:00
 * @LastEditors: nevin
 * @Description: 任务
 */
import { Button, Tag, Tooltip, Spin } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { Task, TaskProduct, TaskType } from '@@/types/task';
import { taskApi } from '@/api/task';
import { TaskInfoRef } from './components/popInfo';
import TaskInfo from './components/carInfo';
import { InfoCircleOutlined } from '@ant-design/icons';
import styles from './task.module.scss';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export default function Page() {
  const [taskList, setTaskList] = useState<Task<TaskProduct>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 9,
    pageNo: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList(isLoadMore = false) {
    setLoading(true);
    try {
      const res = await taskApi.getTaskList<TaskProduct>({
        ...pageInfo,
        type: TaskType.PRODUCT,
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

  // 计算佣金比例
  const calculateCommissionRate = (price: number, reward: number) => {
    if (!price || price === 0) return 0;
    return Math.round((reward / price) * 100);
  };

  // 计算节省金额
  const calculateSavings = (price: number, reward: number) => {
    return reward.toFixed(2);
  };

  return (
    <div className={styles.taskListContainer}>
      <TaskInfo ref={Ref_TaskInfo} />

      <div className={styles.productGridContainer}>
        <div className={styles.productGrid}>
          {taskList.map((task) => {
            const price = task.dataInfo?.price || 0;
            const reward = task.reward || 0;
            const commissionRate = calculateCommissionRate(price, reward);
            const savings = calculateSavings(price, reward);

            return (
              <div key={task._id} className={styles.productCard}>
                <div className={styles.productContent}>
                  <div className={styles.imageContainer}>
                    <img
                      src={`${FILE_BASE_URL}${task.imageUrl}`}
                      alt={task.title}
                      className={styles.productImage}
                    />
                  </div>

                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>
                      {task.dataInfo?.title || task.title}
                    </h3>
                    <div className={styles.priceRow}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span className={styles.price}>
                          ¥{task.dataInfo?.price || '暂无价格'}
                        </span>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>已售：</span>
                          <span className={styles.infoValue}>
                            {task.dataInfo?.sales || 0}
                          </span>
                        </div>
                      </div>

                      <div
                        className={styles.discountTag}
                        style={{ margin: '8px 0' }}
                      >
                        <Tag color="#ff4d4f">高佣{commissionRate}%</Tag>
                        <Tag color="#ff4d4f">赚¥{savings}</Tag>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>带货等级：</span>
                        <span className={styles.infoValue}>LV03及以上</span>
                      </div>
                      <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>招募人数：</span>
                        <span className={styles.infoValue}>
                          {task.maxRecruits}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.taskFooter}>
                  <div className={styles.taskTips}>
                    新号首次报名，奖励1-100元，立即到账
                    <Tooltip title="新用户首次完成任务可获得随机奖励">
                      <InfoCircleOutlined className={styles.infoIcon} />
                    </Tooltip>
                  </div>
                  <Button
                    disabled={task.isAccepted}
                    type="primary"
                    className={styles.applyButton}
                    onClick={() => Ref_TaskInfo.current?.init(task)}
                  >
                    报名
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        )}

        {!loading && hasMore && (
          <div className={styles.loadMoreContainer}>
            <Button onClick={loadMore}>查看更多项目...</Button>
          </div>
        )}
      </div>
    </div>
  );
}
