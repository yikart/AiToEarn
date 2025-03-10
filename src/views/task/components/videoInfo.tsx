/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-03 18:05:59
 * @LastEditors: nevin
 * @Description: video
 */
import { Button, Modal, Tag, Divider, Row, Col, message } from 'antd';
import { Task, TaskStatusName, TaskTypeName, TaskVideo } from '@@/types/task';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import styles from './videoInfo.module.scss';
import { 
  ClockCircleOutlined, 
  TeamOutlined, 
  TagOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  CopyOutlined
} from '@ant-design/icons';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskVideo>) => Promise<void>;
}

const Com = forwardRef<TaskInfoRef>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskVideo> | null>();

  async function init(inTaskInfo: Task<TaskVideo>) {
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
      const res = await taskApi.taskApply<TaskVideo>(taskInfo?.id);
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
    navigator.clipboard.writeText(id)
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
              <Tag color="#f50" className={styles.taskTag}>
                {taskInfo.dataInfo?.type || '视频任务'}
              </Tag>
            </div>
            
            <div className={styles.taskInfoContent}>
              <Row gutter={24}>
                <Col span={12}>
                  <div className={styles.videoContainer}>
                    <div className={styles.taskImageContainer}>
                      <img
                        src={`${FILE_BASE_URL}${taskInfo.imageUrl}`}
                        alt={taskInfo.title}
                        className={styles.taskImage}
                      />
                      <div className={styles.videoOverlay}>
                        <PlayCircleOutlined className={styles.playIcon} />
                      </div>
                    </div>
                    <div className={styles.videoCaption}>视频封面预览</div>
                  </div>
                </Col>
                
                <Col span={12}>
                  <div className={styles.taskDetails}>
                    <div className={styles.taskDetail}>
                      <TagOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>任务类型:</span>
                      <span className={styles.detailValue}>
                        {TaskTypeName.get(taskInfo.type) || '视频任务'}
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
                      <span className={styles.detailLabel}>任务要求:</span>
                      <span className={styles.detailValue}>
                        {taskInfo.requirement || '不许删文'}
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
                  dangerouslySetInnerHTML={{ __html: taskInfo.description || '暂无描述' }}
                />
              </div>
              
              {taskInfo.dataInfo && (
                <>
                  <Divider />
                  <div className={styles.videoDetails}>
                    <h3 className={styles.sectionTitle}>视频详情</h3>
                    <div className={styles.videoInfo}>
                      <div className={styles.videoInfoItem}>
                        <span className={styles.videoInfoLabel}>视频标题:</span>
                        <span className={styles.videoInfoValue}>{taskInfo.dataInfo.title || '未知'}</span>
                      </div>
                      
                      <div className={styles.videoInfoItem}>
                        <span className={styles.videoInfoLabel}>视频描述:</span>
                        <span className={styles.videoInfoValue}>{taskInfo.dataInfo.desc || '暂无描述'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className={styles.taskInfoFooter}>
              <div className={styles.taskStatus}>
                <span className={styles.statusLabel}>任务状态:</span>
                <Tag color="#87d068">{TaskStatusName.get(taskInfo.status) || '进行中'}</Tag>
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
