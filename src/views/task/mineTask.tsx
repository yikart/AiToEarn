/*
 * @Author: nevin
 * @Date: 2025-02-27 19:37:08
 * @LastEditTime: 2025-03-02 22:40:53
 * @LastEditors: nevin
 * @Description: 我的任务列表
 */
import { Button, Card, Spin, Modal, Select, Space, Tag, Empty, message, Tooltip } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { taskApi } from '@/api/task';
import { UserTask, UserTaskStatus } from '@/api/types/task';
import { Task, TaskDataInfo } from '@@/types/task';
import MineTaskInfo, { MineTaskInfoRef } from './components/mineInfo';
import { WithdrawRef } from './components/withdraw';
import Withdraw from './components/withdraw';
import styles from './mineTask.module.scss';
import { 
  ReloadOutlined, 
  FilterOutlined, 
  ClockCircleOutlined, 
  DollarOutlined,
  FileTextOutlined,
  RightOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import bindTaskImg from '@/assets/task/binds.png';
import checkTaskImg from '@/assets/task/waits.png';
import publishTaskImg from '@/assets/task/fabu.png';
import rewardTaskImg from '@/assets/task/jiesuan.png';
import qr1 from '@/assets/task/qr1.png';
import qr2 from '@/assets/task/qr2.png';

const UserTaskStatusNameMap = new Map<UserTaskStatus, string>([
  [UserTaskStatus.DODING, '进行中'],
  [UserTaskStatus.PENDING, '待审核'],
  [UserTaskStatus.APPROVED, '已通过'],
  [UserTaskStatus.REJECTED, '已拒绝'],
  [UserTaskStatus.COMPLETED, '已完成'],
  [UserTaskStatus.CANCELLED, '已取消'],
  [UserTaskStatus.PENDING_REWARD, '待发放奖励'],
  [UserTaskStatus.REWARDED, '已发放奖励'],
]);

// 状态对应的颜色
const UserTaskStatusColorMap = new Map<UserTaskStatus, string>([
  [UserTaskStatus.DODING, 'processing'],
  [UserTaskStatus.PENDING, 'warning'],
  [UserTaskStatus.APPROVED, 'success'],
  [UserTaskStatus.REJECTED, 'error'],
  [UserTaskStatus.COMPLETED, 'success'],
  [UserTaskStatus.CANCELLED, 'default'],
  [UserTaskStatus.PENDING_REWARD, 'warning'],
  [UserTaskStatus.REWARDED, 'success'],
]);

export default function Page() {
  const [taskList, setTaskList] = useState<UserTask<Task<TaskDataInfo>>[]>([]);
  const [pageInfo, setPageInfo] = useState({
    pageSize: 10,
    pageNo: 1,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isGuideModalVisible, setIsGuideModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<UserTaskStatus | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchTaskDetails = async (isLoadMore = false) => {
    setLoading(true);
    try {
      const params = {
        ...pageInfo,
        status: statusFilter,
      };
      
      // 如果没有选择状态筛选，则不传status参数
      if (statusFilter === null) {
        delete params.status;
      }
      
      const tasks = await taskApi.getMineTaskList(params);
      
      if (isLoadMore) {
        setTaskList(prev => [...prev, ...tasks.items]);
      } else {
        setTaskList(tasks.items);
      }
      
      setPageInfo(prev => ({
        ...prev,
        totalCount: (tasks as any).totalCount,
      }));
      
      // 检查是否还有更多数据
      setHasMore(pageInfo.pageNo * pageInfo.pageSize < (tasks as any).totalCount);
    } catch (error) {
      console.error('获取任务列表失败', error);
      message.error('获取任务列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [statusFilter]);

  // 加载更多数据
  const loadMore = () => {
    setPageInfo(prev => ({
      ...prev,
      pageNo: prev.pageNo + 1,
    }));
    fetchTaskDetails(true);
  };

  // 刷新数据
  const refreshData = () => {
    setPageInfo({
      pageSize: 10,
      pageNo: 1,
      totalCount: 0,
    });
    fetchTaskDetails();
    message.success('数据已刷新');
  };

  const Ref_MineTaskInfo = useRef<MineTaskInfoRef>(null);
  const Ref_Withdraw = useRef<WithdrawRef>(null);

  async function withdraw(task: UserTask<Task<TaskDataInfo>>) {
    Ref_Withdraw.current?.init(task);
  }

  // 打开指南弹窗
  const openGuideModal = () => {
    setIsGuideModalVisible(true);
  };

  // 关闭指南弹窗
  const closeGuideModal = () => {
    setIsGuideModalVisible(false);
  };
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '暂无日期';
    return dayjs(dateString).format('YYYY/MM/DD HH:mm');
  };
  
  // 查看任务详情
  const viewTaskDetail = (task: UserTask<Task<TaskDataInfo>>) => {
    Ref_MineTaskInfo.current?.init(task);
  };

  return (
    <div className={styles.mineTaskContainer}>
      <MineTaskInfo ref={Ref_MineTaskInfo} />
      <Withdraw ref={Ref_Withdraw} />
      
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>我的任务</h2>
        <div className={styles.pageActions}>
          <Space size={12}>
            <Select
              className={styles.statusFilter}
              placeholder="筛选任务状态"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setStatusFilter(value)}
              value={statusFilter}
              options={Array.from(UserTaskStatusNameMap).map(([value, label]) => ({
                value,
                label,
              }))}
              suffixIcon={<FilterOutlined />}
            />
            <Button 
              className={styles.refreshButton}
              icon={<ReloadOutlined />} 
              onClick={refreshData}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              onClick={openGuideModal}
              icon={<QuestionCircleOutlined />}
            >
              接单指南
            </Button>
          </Space>
        </div>
      </div>
      
      {loading && taskList.length === 0 ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      ) : taskList.length === 0 ? (
        <div className={styles.emptyContainer}>
          <Empty description={false} />
          <div className={styles.emptyText}>
            <h3>暂无任务</h3>
            <p>您还没有接受任何任务，可以前往任务市场查看更多任务</p>
          </div>
          <Button type="primary" onClick={openGuideModal} style={{ marginTop: 16 }}>
            查看接单指南
          </Button>
        </div>
      ) : (
        <div className={styles.taskList}>
          {taskList.map((task) => {
            // 获取任务详情，处理可能的undefined情况
            const taskDetail = task.taskId || {};
            
            return (
              <Card key={task._id} className={styles.taskCard} bordered={false}>
                <div className={styles.taskCardContent}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskHeader}>
                      <h3 className={styles.taskTitle}>
                        {taskDetail.title || '未知任务'}
                        <span className={styles.taskId}>
                          订单号: {task._id}
                        </span>
                      </h3>
                      <Tag 
                        color={UserTaskStatusColorMap.get(task.status as UserTaskStatus) || 'default'} 
                        className={styles.statusTag}
                      >
                        {UserTaskStatusNameMap.get(task.status as UserTaskStatus) || '未知状态'}
                      </Tag>
                    </div>
                    
                    <div className={styles.taskDetails}>
                      <div className={styles.taskDetail}>
                        <ClockCircleOutlined className={styles.detailIcon} />
                        <span className={styles.detailLabel}>接单时间:</span>
                        <span className={styles.detailValue}>{formatDate(task.createTime)}</span>
                      </div>
                      
                      <div className={styles.taskDetail}>
                        <FileTextOutlined className={styles.detailIcon} />
                        <span className={styles.detailLabel}>任务要求:</span>
                        <span className={styles.detailValue}>{taskDetail.requirement || '不许删文'}</span>
                      </div>
                      
                      <div className={styles.taskDetail}>
                        <DollarOutlined className={styles.detailIcon} />
                        <span className={styles.detailLabel}>任务奖励:</span>
                        <span className={styles.detailValue}>¥{taskDetail.reward || 5}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.taskAction}>
                    {(task.status === UserTaskStatus.APPROVED || 
                      task.status === UserTaskStatus.COMPLETED || 
                      task.status === UserTaskStatus.REWARDED) && (
                      <Button
                        type="primary"
                        danger
                        className={styles.withdrawButton}
                        onClick={() => withdraw(task)}
                      >
                        提现
                      </Button>
                    )}
                    
                    <Button
                      className={styles.viewButton}
                      onClick={() => viewTaskDetail(task)}
                    >
                      查看详情 <RightOutlined />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {loading && (
            <div className={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          )}
          
          {!loading && hasMore && (
            <div className={styles.loadMoreContainer}>
              <Button onClick={loadMore}>加载更多</Button>
            </div>
          )}
        </div>
      )}
      
      <Modal
        title="接单指南"
        open={isGuideModalVisible}
        onCancel={closeGuideModal}
        footer={null}
        width={800}
        className={styles.guideModal}
      >
        <div className={styles.guideContainer}>
          <div className={styles.guideHeader}>
            <h2>如何接单赚钱</h2>
            <div className={styles.guideDate}>更新时间: 2025年3月1日</div>
          </div>
          
          <div className={styles.guideIntro}>
            <p>
              欢迎使用任务市场！本指南将帮助您了解如何通过接单赚取额外收入。请仔细阅读以下步骤，确保您能顺利完成任务并获得奖励。
            </p>
          </div>
          
          <div className={styles.guideSection}>
            <h3>操作步骤</h3>
            <ol className={styles.guideSteps}>
              <li>
                <p>
                  关注公众号"任务市场"，获取最新任务通知和平台动态。
                </p>
                <div className={styles.qrCodeContainer}>
                  <div className={styles.qrCodeItem}>
                    <div className={styles.qrCodeWrapper}>
                      <img src={qr1} alt="任务市场公众号" className={styles.qrCode} />
                    </div>
                    <div className={styles.qrCodeText}>任务市场公众号</div>
                    <div className={styles.qrCodeSubtext}>获取最新任务通知</div>
                  </div>
                </div>
              </li>
              <li>
                <p>点击下方链接下载爱团团接单软件（已下载可忽略）</p>
                <p className={styles.guideLink}>http://s.sqllb.com/Kky80</p>
              </li>
              <li>
                <p>
                  【多开面板】或【管理中心】添加小红书、抖音、视频号、B站等平台账号，等待3天左右，可以前往【任务市场】查看任务和接单（如下图）
                </p>
                <div className={styles.guideImageContainer}>
                  <img
                    src={bindTaskImg}
                    alt="管理中心-添加账号"
                    className={styles.guideImage}
                  />
                  <p className={styles.guideImageCaption}>管理中心-添加账号</p>
                </div>
                <p>列表会展示添加成功的账号</p>
                <div className={styles.guideImageContainer}>
                  <img
                    src={checkTaskImg}
                    alt="绑定账号后等待3天左右会显示项目"
                    className={styles.guideImage}
                  />
                  <p className={styles.guideImageCaption}>
                    绑定账号后等待3天左右会显示项目
                  </p>
                </div>
              </li>
              <li>
                <p>
                  耐心等待任务下发，任务下发后，请仔细判断是否符合自己账号调性，确认合适再进行发布，一旦发布不可删除，否则必须补发且影响您后续得到派单。
                </p>
              </li>
              <li>
                <p>
                  建议日常无单时积极运营账号，保持真诚、分享、有用的人设，有利于后续接到更多高质量的订单。连续接广告无原创内容、不经常更新、批量做矩阵账号都是封号高危原因，对后续发展不利。
                </p>
              </li>
            </ol>
          </div>

          <div className={styles.guideSection}>
            <h3>常见问题</h3>
            <div className={styles.guideFaq}>
              <div className={styles.faqItem}>
                <h4>为什么我没有项目？</h4>
                <div className={styles.faqAnswer}>
                  <p>
                    请先完成上方操作步骤的所有流程。如果您已在爱团团绑定小红书等账号，请耐心等待派单。24小时、48小时没有得到派单都是正常的。超过1周没有收到项目邀请可填写下方收集表快速排查为何没有单子
                  </p>
                  <p className={styles.guideLink}>
                    【收集表】快速排查为何没单子
                  </p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>手机如何发文？</h4>
                <div className={styles.faqAnswer}>
                  <p>
                    请先完成上方操作步骤中流程。公众号收到接单邀请，点击即可手机发文（手机操作一键发文前提是电脑需保证爱团团和发文账号在线，否则还需使用电脑发文）
                  </p>
                  <div className={styles.guideImageContainer}>
                    <img
                      src={qr2}
                      alt="点击该模板消息可手机发文"
                      className={styles.guideImage}
                    />
                    <p className={styles.guideImageCaption}>
                      点击该模板消息可手机发文
                    </p>
                  </div>
                  <p>点击下方链接下载爱团团接单软件（已下载可忽略）</p>
                  <p className={styles.guideLink}>http://s.sqllb.com/Kky80</p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>有人在我接的单子下面评论该怎么回复？</h4>
                <div className={styles.faqAnswer}>
                  <p>请私聊工作人员，直接发送您的订单号和用户回复截图。</p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>抖音一直发不出去怎么办？</h4>
                <div className={styles.faqAnswer}>
                  <p>
                    由于存在难以攻克的技术问题，约
                    30%的抖音订单无法正常发布，很遗憾您这单在此之列。对此给您带来不好的体验深表歉意，这单您可以放弃。
                  </p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>我的账号不想接单怎么办？</h4>
                <div className={styles.faqAnswer}>
                  <p>
                    如您不想接单或有账号不想收到任务市场消息提醒，可填写下表，后续【任务市场】将不再给您发邀请和派任务。
                  </p>
                  <p className={styles.guideLink}>
                    【收集表】任务市场不接单申请
                  </p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>违规提示或账号封禁怎么处理？</h4>
                <div className={styles.faqAnswer}>
                  <p>将订单号和违规截图私聊发给工作人员。</p>
                  <p>如未回复消息请耐心等待（工作时间：工作日9:00-18:00）</p>
                  <p>前往新榜查看更多新媒体相关信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
