import { Button, Modal, Tag, Divider, Row, Col, message } from 'antd';
import { Task, TaskTypeName, TaskArticle } from '@@/types/task';
import { PubType } from '@@/publish/PublishEnum';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import styles from './articleInfo.module.scss';
import {
  ClockCircleOutlined,
  TeamOutlined,
  TagOutlined,
  DollarOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import ChooseAccountModule from '@/views/publish/components/ChooseAccountModule/ChooseAccountModule';
import { AccountType } from '@@/AccountEnum';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskArticle>) => Promise<void>;
}

interface TaskInfoProps {
  onTaskApplied?: () => void;
}

const Com = forwardRef<TaskInfoRef, TaskInfoProps>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskArticle> | null>();
  const [downloading, setDownloading] = useState(false);
  const [taskRecord, setTaskRecord] = useState<{
    _id: string;
    createTime: string;
    isFirstTimeSubmission: boolean;
    status: string;
    taskId: string;
  } | null>(null);

  const { onTaskApplied } = props;

  async function init(inTaskInfo: Task<TaskArticle>) {
    setTaskInfo(inTaskInfo);
    setIsModalOpen(true);
  }

  useImperativeHandle(ref, () => ({
    init: init,
  }));

  /**
   * 接受任务
   */
  async function taskApply() {}

  /**
   * 完成任务
   */
  async function taskDone() {
    console.log('完成任务', taskInfo, taskRecord);
    if (!taskInfo || !taskRecord) {
      message.error('任务信息不完整，无法完成任务');
      return;
    }

    try {
      const res = await taskApi.taskDone(taskRecord._id, {
        submissionUrl: taskInfo.title,
        screenshotUrls: [taskInfo.imageUrl],
        qrCodeScanResult: taskInfo.title,
      });
      message.success('任务发布成功！');
    } catch (error) {
      message.error('完成任务失败，请稍后再试');
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

  // 账户选择弹框显示隐藏状态
  const [chooseAccountOpen, setChooseAccountOpen] = useState(false);
  const [accountListChoose, setAccountListChoose] = useState<any[]>([]);

  return (
    <>
      <ChooseAccountModule
        open={chooseAccountOpen}
        onClose={() => !downloading && setChooseAccountOpen(false)}
        platChooseProps={{
          choosedAccounts: accountListChoose,
          pubType: PubType.ARTICLE,
          allowPlatSet: new Set([AccountType.Douyin]),
        }}
        onPlatConfirm={async (aList) => {
          console.log('账号:', aList);
          setAccountListChoose(aList);
          console.log('选择的账号:', aList);
          // 这里可以添加发布文章的逻辑
          setChooseAccountOpen(false);
        }}
      />

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
                  ID: {taskInfo._id}
                  <CopyOutlined
                    className={styles.copyIcon}
                    onClick={() => copyTaskId(taskInfo._id)}
                  />
                </span>
              </h2>
              <Tag color="#a66ae4" className={styles.taskTag}>
                {(taskInfo.dataInfo as any)?.type || '文章任务'}
              </Tag>
            </div>

            <div className={styles.taskInfoContent}>
              <Row gutter={24}>
                <Col span={12}>
                  <div className={styles.articleContainer}>
                    <div className={styles.taskImageContainer}>
                      <img
                        src={`${FILE_BASE_URL}${taskInfo.imageUrl}`}
                        alt={taskInfo.title}
                        className={styles.taskImage}
                      />
                    </div>
                    <div className={styles.articleCaption}>文章封面预览</div>
                  </div>
                </Col>

                <Col span={12}>
                  <div className={styles.taskDetails}>
                    <div className={styles.taskDetail}>
                      <TagOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>任务类型:</span>
                      <span className={styles.detailValue}>
                        {TaskTypeName.get(taskInfo.type) || '文章任务'}
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
                        {taskInfo.maxRecruits || 0}
                      </span>
                    </div>

                    <div className={styles.taskDetail}>
                      <DollarOutlined className={styles.detailIcon} />
                      <span className={styles.detailLabel}>任务奖励:</span>
                      <span className={styles.detailValue}>
                        ¥{taskInfo.reward || 0}
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
                  dangerouslySetInnerHTML={{
                    __html: taskInfo.description || '暂无描述',
                  }}
                />
              </div>

              {taskInfo.dataInfo && (
                <>
                  <Divider />
                  <div className={styles.articleDetails}>
                    <h3 className={styles.sectionTitle}>文章详情</h3>
                    <div className={styles.articleInfo}>
                      <div className={styles.articleInfoItem}>
                        <span className={styles.articleInfoLabel}>
                          文章标题:
                        </span>
                        <span className={styles.articleInfoValue}>
                          {taskInfo.dataInfo.title || '未知'}
                        </span>
                      </div>

                      <div className={styles.articleInfoItem}>
                        <span className={styles.articleInfoLabel}>
                          文章描述:
                        </span>
                        <span className={styles.articleInfoValue}>
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
                <Tag color="#a66ae4">进行中</Tag>
              </div>
              <div className={styles.taskActions}>
                <Button className={styles.cancelButton} onClick={handleCancel}>
                  取消
                </Button>
                <Button
                  type="primary"
                  className={styles.applyButton}
                  onClick={taskApply}
                >
                  接受任务
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.noDataContainer}>暂无数据</div>
        )}
      </Modal>
    </>
  );
});

Com.displayName = 'ArticleInfo';

export default Com;
