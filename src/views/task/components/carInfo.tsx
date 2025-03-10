/*
 * @Author: nevin
 * @Date: 2025-02-27 20:44:31
 * @LastEditTime: 2025-03-03 18:04:32
 * @LastEditors: nevin
 * @Description: 挂车
 */
import { Button, Modal } from 'antd';
import { Task, TaskProduct } from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import styles from './carInfo.module.scss';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskProduct>) => Promise<void>;
}

const Com = forwardRef<TaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskProduct> | null>();

  async function init(inTaskInfo: Task<TaskProduct>) {
    setTaskInfo(inTaskInfo);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  /**
   * 接受任务
   */
  async function taskApply() {
    if (!taskInfo) return;

    const res = await taskApi.taskApply(taskInfo?._id);
    setTaskInfo(res as any);
    setIsModalOpen(false);
  }

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 计算佣金比例
  const calculateCommissionRate = (price: number, reward: number) => {
    if (!price || price === 0) return 0;
    return Math.round((reward / price) * 100);
  };

  return (
    <>
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
        className={styles.taskDetailModal}
      >
        {taskInfo ? (
          <div className={styles.taskDetailContainer}>
            <h2 className={styles.taskTitle}>{taskInfo.title}</h2>

            <div className={styles.taskContent}>
              <div className={styles.taskImageContainer}>
                <img
                  src={`${FILE_BASE_URL}${taskInfo.imageUrl}`}
                  alt={taskInfo.title}
                  className={styles.taskImage}
                />
                <div className={styles.taskImageTags}>
                  <div
                    className={styles.richTextTag}
                    dangerouslySetInnerHTML={{
                      __html: taskInfo.description || '',
                    }}
                  />
                </div>
              </div>

              <div className={styles.taskInfoContainer}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>带货等级：</span>
                  <span className={styles.infoValue}>LV03及以上</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>报名人数：</span>
                  <span className={styles.infoValue}>
                    {taskInfo.maxRecruits || 10000}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>挂购物车：</span>
                  <span className={styles.infoValue}>是</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>合作要求：</span>
                  <span className={styles.infoValue}>
                    发布需挂车，可使用已有素材或自由素材创作发布
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>商品售价：</span>
                  <span className={styles.infoPrice}>
                    ¥{taskInfo.dataInfo?.price || 0}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>分佣比例：</span>
                  <span className={styles.infoValue}>
                    {calculateCommissionRate(
                      taskInfo.dataInfo?.price || 0,
                      taskInfo.reward || 0,
                    )}
                    %
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>每单预估收益：</span>
                  <span className={styles.infoReward}>
                    ¥{taskInfo.reward?.toFixed(2) || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.taskFooter}>
              <Button
                key="back"
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                取消
              </Button>
              <Button
                key="submit"
                type="primary"
                onClick={taskApply}
                className={styles.applyButton}
              >
                报名
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.noDataContainer}>暂无任务信息</div>
        )}
      </Modal>
    </>
  );
});

export default Com;
