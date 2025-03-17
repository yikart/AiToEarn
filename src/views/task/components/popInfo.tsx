/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:06:07
 * @LastEditors: nevin
 * @Description: pop
 */
import { Button, Modal, Tag, Divider, Row, Col, message } from 'antd';
import {
  Task,
  TaskPromotion,
  TaskStatusName,
  TaskTypeName,
} from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import styles from './popInfo.module.scss';
import {
  ClockCircleOutlined,
  TeamOutlined,
  TagOutlined,
  DollarOutlined,
  QrcodeOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskPromotion>) => Promise<void>;
}

const Com = forwardRef<TaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskPromotion> | null>();

  async function init(inTaskInfo: Task<TaskPromotion>) {
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

    try {
      const res = await taskApi.taskApply(taskInfo?._id);
      setTaskInfo(res);
      message.success('任务接受成功！');
      setIsModalOpen(false);
    } catch (error) {
      message.error('接受任务失败，请稍后再试');
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false);
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

  return (
    <>
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
        className={styles.taskInfoModal}
        destroyOnClose
      >
        {taskInfo ? (
          <div className={styles.taskInfoContainer}>
            <div className={styles.taskInfoHeader}>
              <h2 className={styles.taskTitle}>
                {taskInfo.title}
                <span className={styles.taskId}>
                  ID: {taskInfo.id}
                  <CopyOutlined
                    className={styles.copyIcon}
                    onClick={() => copyTaskId(taskInfo.id)}
                  />
                </span>
              </h2>
              <Tag color="#108ee9" className={styles.taskTag}>
                {(taskInfo.dataInfo as any)?.type || 'AI对话APP'}
              </Tag>
            </div>

            <div className={styles.taskInfoContent}>
              <Row gutter={24}>
                <Col span={12}>
                  <div className={styles.taskImageContainer}>
                    <img
                      src={`${FILE_BASE_URL}${taskInfo.imageUrl}`}
                      alt={taskInfo.title}
                      className={styles.taskImage}
                    />
                  </div>
                </Col>

                <Col span={12}>
                  <div className={styles.taskDetails}>
                    <div className={styles.taskDetail}>
                      <TagOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>任务类型:</span>
                      <span className={styles.detailValue}>
                        {TaskTypeName.get(taskInfo.type) || '推广任务'}
                      </span>
                    </div>

                    <div className={styles.taskDetail}>
                      <ClockCircleOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>截止时间:</span>
                      <span className={styles.detailValue}>
                        {taskInfo.deadline || '2025/03/17'}
                      </span>
                    </div>

                    <div className={styles.taskDetail}>
                      <TeamOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>招募人数:</span>
                      <span className={styles.detailValue}>
                        {taskInfo.maxRecruits || 100}
                      </span>
                    </div>

                    <div className={styles.taskDetail}>
                      <DollarOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>任务奖励:</span>
                      <span className={styles.detailValue}>
                        ¥{taskInfo.reward || 5}
                      </span>
                    </div>

                    <div className={styles.taskDetail}>
                      <QrcodeOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>任务要求:</span>
                      <span className={styles.detailValue}>
                        {taskInfo?.requirement || '扫二维码下载APP并完成注册'}
                      </span>
                    </div>
                  </div>
                </Col>
              </Row>

              <Divider />

              <div className={styles.taskDescription}>
                <h3 className={styles.sectionTitle}>任务描述</h3>
                <div
                  className={styles.descriptionContent}
                  dangerouslySetInnerHTML={{
                    __html: taskInfo.description || '暂无描述',
                  }}
                />
              </div>

              {taskInfo.dataInfo && (
                <>
                  <Divider />
                  <div className={styles.appDetails}>
                    <h3 className={styles.sectionTitle}>APP详情</h3>
                    <div className={styles.appInfo}>
                      <div className={styles.appInfoItem}>
                        <span className={styles.appInfoLabel}>APP名称:</span>
                        <span className={styles.appInfoValue}>
                          {taskInfo.dataInfo.title || '未知'}
                        </span>
                      </div>

                      <div className={styles.appInfoItem}>
                        <span className={styles.appInfoLabel}>APP描述:</span>
                        <span className={styles.appInfoValue}>
                          {taskInfo.dataInfo.desc || '暂无描述'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.taskInfoFooter}>
              <div className={styles.taskStatus}>
                <span className={styles.statusLabel}>任务状态:</span>
                <Tag color="#a66ae4">
                  {TaskStatusName.get(taskInfo.status) || '进行中'}
                </Tag>
              </div>

              <div className={styles.taskActions}>
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
                  接受任务
                </Button>
              </div>
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
