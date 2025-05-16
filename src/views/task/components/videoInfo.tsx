/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-24 14:28:36
 * @LastEditors: nevin
 * @Description: video
 */
import { Button, Modal, Tag, Divider, Row, Col, message } from 'antd';
import { Task, TaskStatusName, TaskTypeName, TaskVideo } from '@@/types/task';
import { PubType } from '@@/publish/PublishEnum';
import {
  icpCreatePubRecord,
  icpCreateVideoPubRecord,
  icpPubVideo,
} from '@/icp/publish';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { taskApi } from '@/api/task';
import styles from './videoInfo.module.scss';
import {
  ClockCircleOutlined,
  TeamOutlined,
  TagOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import ChooseAccountModule from '@/views/publish/components/ChooseAccountModule/ChooseAccountModule';
import { ipcDownFile } from '@/icp/tools';
import { AccountType } from '@@/AccountEnum';
import VideoPlayer from '@/components/VideoPlayer';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

export interface TaskInfoRef {
  init: (pubRecord: Task<TaskVideo>) => Promise<void>;
}

interface TaskInfoProps {
  onTaskApplied?: () => void; // 新增
}

const Com = forwardRef<TaskInfoRef, TaskInfoProps>((props: any, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskInfo, setTaskInfo] = useState<Task<TaskVideo> | null>();
  const [downloading, setDownloading] = useState(false);
  const [videoPlayback, setVideoPlayback] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: '',
    title: '',
  });

  // 在组件内添加一个新的状态来存储任务记录
  const [taskRecord, setTaskRecord] = useState<{
    _id: string;
    createTime: string;
    isFirstTimeSubmission: boolean;
    status: string;
    taskId: string;
  } | null>(null);

  // 从props中获取刷新函数
  const { onTaskApplied } = props;

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
  }

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
      // 使用任务记录的 ID 而不是任务 ID
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

  // 下载文件到本地并发布
  const downloadAndPublish = async (aList: any) => {
    console.log('下载文件到本地并发布', aList, taskInfo);
    if (!taskInfo || !taskInfo.dataInfo) {
      message.error('任务信息不完整，无法发布');
      return;
    }

    setDownloading(true);
    try {
      console.log('开始下载文件...');
      message.loading('正在下载视频和封面图片，请稍候...', 0);

      // 构建完整的文件URL
      const videoUrl = FILE_BASE_URL + taskInfo.dataInfo.videoUrl;
      const coverUrl = FILE_BASE_URL + taskInfo.imageUrl;

      console.log('下载视频:', videoUrl);
      console.log('下载封面:', coverUrl);

      // 使用IPC接口下载视频文件到本地临时目录
      const localVideoPath = await ipcDownFile(videoUrl);

      // 使用IPC接口下载封面图片到本地临时目录
      const localCoverPath = await ipcDownFile(coverUrl);

      console.log('视频已下载到:', localVideoPath);
      console.log('封面已下载到:', localCoverPath);

      message.destroy();
      message.success('文件下载完成，开始发布...');

      // 创建一级记录
      const recordRes = await icpCreatePubRecord({
        title: taskInfo.dataInfo.title || '/',
        desc: taskInfo.dataInfo.desc || '/',
        type: PubType.VIDEO,
        videoPath: localVideoPath,
        coverPath: localCoverPath,
      });

      // 创建二级记录
      for (const vData of aList) {
        // console.log('vData', vData)
        const account = vData;
        // console.log('account', account)

        await icpCreateVideoPubRecord({
          type: account.type,
          accountId: account.id,
          pubRecordId: recordRes.id,
          publishTime: new Date(),
          title: taskInfo.dataInfo.title,
          // topics: vData.pubParams.topics,
          desc: taskInfo.dataInfo.desc,
          videoPath: localVideoPath,
          coverPath: localCoverPath,
        });
      }

      // 发布视频
      const okRes = await icpPubVideo(recordRes.id);

      // 成功数据
      const successList = okRes.filter((v) => v.code === 1);

      console.log('发布成功', successList);
      console.log('发布结果', okRes);

      if (successList.length > 0) {
        message.success(`成功发布到${successList.length}个平台`);
        taskDone();
      } else {
        message.warning('发布完成，但没有成功发布的平台');
      }
    } catch (error) {
      console.error('下载或发布过程中出错:', error);
      message.error('下载或发布过程中出错，请重试');
    } finally {
      setDownloading(false);
      setChooseAccountOpen(false);
    }
  };

  // 打开视频播放器
  const openVideoPlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (taskInfo?.dataInfo?.videoUrl) {
      setVideoPlayback({
        visible: true,
        url: `${FILE_BASE_URL}${taskInfo.dataInfo.videoUrl}`,
        title: taskInfo.title || '视频播放',
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
    <>
      <VideoPlayer
        videoUrl={videoPlayback.url}
        visible={videoPlayback.visible}
        onClose={closeVideoPlayer}
        title={videoPlayback.title}
      />

      <ChooseAccountModule
        open={chooseAccountOpen}
        onClose={() => !downloading && setChooseAccountOpen(false)}
        platChooseProps={{
          choosedAccounts: accountListChoose,
          pubType: PubType.VIDEO,
          allowPlatSet: new Set([AccountType.Douyin]),
        }}
        onPlatConfirm={async (aList) => {
          console.log('账号:', aList);
          setAccountListChoose(aList);
          console.log('选择的账号:', aList);
          // 下载文件并发布
          await downloadAndPublish(aList);
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
                {(taskInfo.dataInfo as any)?.type || '视频任务'}
              </Tag>
            </div>

            <div className={styles.taskInfoContent}>
              <Row gutter={24}>
                <Col span={12}>
                  <div className={styles.videoContainer}>
                    <div
                      className={styles.taskImageContainer}
                      onClick={openVideoPlayer}
                    >
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
                  dangerouslySetInnerHTML={{
                    __html: taskInfo.description || '暂无描述',
                  }}
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
                        <span className={styles.videoInfoValue}>
                          {taskInfo.dataInfo.title || '未知'}
                        </span>
                      </div>

                      <div className={styles.videoInfoItem}>
                        <span className={styles.videoInfoLabel}>视频描述:</span>
                        <span className={styles.videoInfoValue}>
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
                  disabled={taskInfo.isAccepted}
                  onClick={taskApply}
                  className={styles.applyButton}
                  style={{ backgroundColor: '#a66ae4', borderColor: '#a66ae4' }}
                >
                  {taskInfo.isAccepted ? '已接受任务' : '接受任务'}
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
