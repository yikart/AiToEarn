/*
 * @Author: nevin
 * @Date: 2025-02-27 19:37:08
 * @LastEditTime: 2025-03-24 14:11:03
 * @LastEditors: nevin
 * @Description: 我的任务列表
 */
import {
  Button,
  Card,
  Spin,
  Modal,
  Select,
  Space,
  Tag,
  Empty,
  message,
} from 'antd';
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
  QuestionCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

import bindTaskImg from '@/assets/task/binds.png';
import checkTaskImg from '@/assets/task/waits.png';
import publishTaskImg from '@/assets/task/fabu.png';
import rewardTaskImg from '@/assets/task/jiesuan.png';
import qr1 from '@/assets/task/qr1.png';
import qr2 from '@/assets/task/qr0.jpg';

const UserTaskStatusNameMap = new Map<UserTaskStatus, string>([
  [UserTaskStatus.DODING, '进行中'],
  [UserTaskStatus.PENDING, '待审核'],
  [UserTaskStatus.APPROVED, '已通过'],
  [UserTaskStatus.REJECTED, '已拒绝'],
  // [UserTaskStatus.COMPLETED, '已完成'],
  [UserTaskStatus.CANCELLED, '已取消'],
  // [UserTaskStatus.PENDING_REWARD, '待发放奖励'],
  [UserTaskStatus.REWARDED, '已发放奖励'],
]);

// 状态对应的颜色
const UserTaskStatusColorMap = new Map<UserTaskStatus, string>([
  [UserTaskStatus.DODING, 'processing'],
  [UserTaskStatus.PENDING, 'warning'],
  [UserTaskStatus.APPROVED, 'success'],
  [UserTaskStatus.REJECTED, 'error'],
  [UserTaskStatus.CANCELLED, 'default'],
  [UserTaskStatus.REWARDED, 'success'],
]);

// 在文件顶部添加任务类型映射
const TASK_TYPE_MAP = {
  video: { name: '视频任务', color: '#a66ae4' },
  promotion: { name: '推广任务', color: '#1890ff' },
  product: { name: '挂车市场任务', color: '#52c41a' },
};

// 渲染空状态
const renderEmptyState = () => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyText}>
        <h3>接单前请务必先浏览《接单指南与常见问题解答》</h3>
        <p>所有关于接单的秘诀都在这里，请不要错过</p>
      </div>

      <div className={styles.guideContainer}>
        <div className={styles.guideStep}>
          <h4>接单前完成以下步骤，接单快人一步</h4>

          <div className={styles.qrCodeContainer}>
            <div className={styles.qrCodeItem}>
              <div className={styles.qrCodeWrapper}>
                <img
                  src={qr1}
                  alt="扫码加入账号招募群"
                  className={styles.qrCode}
                />
              </div>
              <p className={styles.qrCodeText}>扫码加入账号招募群</p>
              <p className={styles.qrCodeSubtext}>不可在群内天打扰他人</p>
            </div>

            <div className={styles.qrCodeItem}>
              <div className={styles.qrCodeWrapper}>
                <img
                  src={qr2}
                  alt="扫码开启更多权益"
                  className={styles.qrCode}
                />
              </div>
              <p className={styles.qrCodeText}>扫码开启更多权益</p>
              <p className={styles.qrCodeSubtext}>手机扫码爱优赚公众号</p>
            </div>
          </div>
        </div>

        <div className={styles.processContainer}>
          <h4 className={styles.processTitle}>接单流程</h4>

          <div className={styles.processSteps}>
            <div className={styles.processStep}>
              <div className={styles.processIcon}>
                <img
                  src={bindTaskImg}
                  alt="前往管理中心绑定账号"
                  className={styles.stepIcon}
                />
              </div>
              <p className={styles.stepText}>前往管理中心绑定账号</p>
            </div>

            <div className={styles.processDivider}></div>

            <div className={styles.processStep}>
              <div className={styles.processIcon}>
                <img
                  src={checkTaskImg}
                  alt="等待平台验证通过"
                  className={styles.stepIcon}
                />
              </div>
              <p className={styles.stepText}>等待平台验证通过</p>
            </div>

            <div className={styles.processDivider}></div>

            <div className={styles.processStep}>
              <div className={styles.processIcon}>
                <img
                  src={publishTaskImg}
                  alt="一键发文"
                  className={styles.stepIcon}
                />
              </div>
              <p className={styles.stepText}>一键发文</p>
            </div>

            <div className={styles.processDivider}></div>

            <div className={styles.processStep}>
              <div className={styles.processIcon}>
                <img
                  src={rewardTaskImg}
                  alt="成功发文等待结算"
                  className={styles.stepIcon}
                />
              </div>
              <p className={styles.stepText}>成功发文等待结算</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
        delete (params as any).status;
      }

      const tasks = await taskApi.getMineTaskList(params as any);

      if (isLoadMore) {
        setTaskList((prev) => [...prev, ...tasks.items]);
      } else {
        setTaskList(tasks.items);
      }

      setPageInfo((prev) => ({
        ...prev,
        totalCount: (tasks as any).totalCount,
      }));

      // 检查是否还有更多数据
      setHasMore(
        pageInfo.pageNo * pageInfo.pageSize < (tasks as any).totalCount,
      );
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
    setPageInfo((prev) => ({
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

  // 刷新任务列表的函数
  const refreshTaskList = () => {
    setPageInfo({
      pageSize: 10,
      pageNo: 1,
      totalCount: 0,
    });
    fetchTaskDetails();
  };

  return (
    <div className={styles.mineTaskContainer}>
      {/* <MineTaskInfo ref={Ref_MineTaskInfo} onTaskSubmitted={refreshTaskList} /> */}
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
              options={Array.from(UserTaskStatusNameMap).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
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
            <p>您还没有接受任何任务，可以前往任务市场查看更多任务</p>
          </div>
          {renderEmptyState()}
        </div>
      ) : (
        <div className={styles.taskList}>
          {taskList.map((task) => {
            // 获取任务详情，处理可能的undefined情况
            const taskDetail = task.taskId || {};

            return (
              <Card key={task._id} className={styles.taskCard} bordered={false}>
                <div className={styles.taskCardContent}>
                  {/* 添加任务图片显示 */}
                  <div className={styles.taskImageContainer}>
                    <img
                      src={`${FILE_BASE_URL}${task.screenshotUrls[0] || taskDetail.imageUrl || ''}`}
                      alt={taskDetail.title}
                      className={styles.taskImage}
                    />
                  </div>

                  <div className={styles.taskInfo}>
                    <div className={styles.taskHeader}>
                      <h3 className={styles.taskTitle}>
                        {taskDetail.title || '未知任务'}
                        <span className={styles.taskId}>
                          订单号: {task._id}
                        </span>
                      </h3>
                      <div className={styles.tagContainer}>
                        {/* 添加任务类型标签 */}
                        <Tag
                          color={
                            (TASK_TYPE_MAP as any)[task.taskId?.type]?.color ||
                            '#a66ae4'
                          }
                          className={styles.typeTag}
                        >
                          {(TASK_TYPE_MAP as any)[task.taskId?.type]?.name ||
                            '视频任务'}
                        </Tag>

                        {/* 原有的状态标签 */}
                        <Tag
                          color={
                            UserTaskStatusColorMap.get(
                              task.status as UserTaskStatus,
                            ) || 'default'
                          }
                          className={styles.statusTag}
                        >
                          {UserTaskStatusNameMap.get(
                            task.status as UserTaskStatus,
                          ) || '未知状态'}
                        </Tag>
                      </div>
                    </div>

                    <div className={styles.taskDetails}>
                      <div className={styles.taskDetail}>
                        <ClockCircleOutlined className={styles.detailIcon} />
                        <span className={styles.detailLabel}>接单时间:</span>
                        <span className={styles.detailValue}>
                          {formatDate(task.createTime)}
                        </span>
                      </div>

                      <div className={styles.taskDetail}>
                        <FileTextOutlined className={styles.detailIcon} />
                        <span className={styles.detailLabel}>任务要求:</span>
                        <span className={styles.detailValue}>
                          {taskDetail.requirement || '不许删文'}
                        </span>
                      </div>

                      <div className={styles.taskDetail}>
                        <DollarOutlined className={styles.detailIcon} />
                        <span className={styles.detailLabel}>任务奖励:</span>
                        <span className={styles.detailValue}>
                          ¥{taskDetail.reward || 5}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.taskAction}>
                    {/* {(task.status === UserTaskStatus.APPROVED ||
                      task.status === UserTaskStatus.COMPLETED ||
                      task.status === UserTaskStatus.REWARDED) && (
                      <Button
                        type="primary"
                        danger
                        className={styles.withdrawButton}
                        style={{
                          backgroundColor: '#a66ae4',
                          borderColor: '#a66ae4',
                          color: 'white',
                          marginBottom: '10px',
                        }}
                        onClick={() => withdraw(task)}
                      >
                        申请提现 <RightOutlined />
                      </Button>
                    )} */}

                    <Button
                      className={styles.viewButton}
                      onClick={() => viewTaskDetail(task)}
                      style={{
                        backgroundColor: '#a66ae4',
                        borderColor: '#a66ae4',
                        color: 'white',
                      }}
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
            <div className={styles.guideDate}>更新时间: 2025年4月16日</div>
          </div>

          <div className={styles.guideIntro}>
          <p>
            尊敬的AiToEarn流量主用户：
            </p>
            <p>
              您好，为了更好地保障广告主和流量主的权益，建立一个健康、公平的广告交易系统，请仔细阅读并确认以下“《AiToEarn任务市场接单合作须知》”后再操作接单：
            </p>
            <p>
              AiToEarn任务市场服务：指AiToEarn为流量主和广告主提供的撮合交易以及技术支持服务。AiToEarn在此过程中提供平台的运营与维护，监督管理平台内经营主体及交易行为，提升广告主与流量主交易体验。
            </p>
          </div>

          <div className={styles.guideSection}>
            <h3>操作步骤</h3>
            <ol className={styles.guideSteps}>
              <li>
                <p>关注公众号"任务市场"，获取最新任务通知和平台动态。</p>
                <div className={styles.qrCodeContainer}>
                  <div className={styles.qrCodeItem}>
                    <div className={styles.qrCodeWrapper}>
                      <img
                        src={qr2}
                        alt="任务市场公众号"
                        className={styles.qrCode}
                      />
                    </div>
                    <div className={styles.qrCodeText}>任务市场公众号</div>
                    <div className={styles.qrCodeSubtext}>获取最新任务通知</div>
                  </div>
                </div>
              </li>
              <li>
                <p>点击下方链接下载爱优赚接单软件（已下载可忽略）</p>
                <p className={styles.guideLink}>https://att.yikart.cn/aiToEarn</p>
              </li>
              <li>
                <p>
                  【账号】添加小红书、抖音、视频号、B站等平台账号，等待3天左右，可以前往【任务市场】查看任务和接单（如下图）
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
                <h4>一.关于流量主账号</h4>
                <div className={styles.faqAnswer}>
                  <p>
                  1.1流量主须自行负责在AiToEarn平台的用户账号和密码，且须对在用户账号密码下发生的所有活动（包括但不限于发布需求信息、网上点击同意各类协议、规则、参与需求投标等）承担责任。流量主有权根据需要更改登录和账户提现密码。如因流量主的过错导致的任何损失由流量主自行承担，该过错包括但不限于：不按照交易提示操作，未及时进行交易操作，遗忘或泄漏密码等。
                  </p>
                  <p >
                  1.2流量主应当注册账户时提供真实准确的注册信息，包括但不限于真实姓名、身份证号、联系电话、地址、邮政编码等，保证AiToEarn工作人员可以通过上述联系方式与流量主进行联系。与此同时，流量主也应当在相关资料实际变更时及时更新有关注册资料。
                  </p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>二.推广内容审核说明</h4>
                <div className={styles.faqAnswer}>
                  <p>
                  2.1针对推广内容，AiToEarn任务市场平台有权对广告主投放内容进行初步审核，并对其中明显涉嫌违反法律法规的内容进行强制性处理，但平台的审核仅为形式审核，重在参照广告法条款进行审核，但因每个社交媒体平台自身规则差异造成的内容违规或下架，AiToEarn不承担相关责任。
                  </p>
                  <p>2.2流量主在接受推广任务前，请自行判断可能带来的不确定性风险，我方不承担任何因推广素材造成的包括但不限于系统删文、禁言及封号、隐藏限流等责任。</p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>三.发布与结算</h4>
                <div className={styles.faqAnswer}>
                  <p>3.1流量主如约完成推送后，推广信息因相关政策或其它非流量主主动因素导致被删除（包括但不限于：用户举报、平台通知配合删除等），如账号数据正常、账号质量过关且在结算期内，AiToEarn任务市场平台应当按照统计金额向乙方支付费用。</p>
                  <p>3.2流量主发布订单内容后，因自身原因人为删除、隐藏、账号封禁等情况导致广告主推广内容不能正常展示推广的，须按照对应订单要求补发或协商处理，否则会受到相应接单限制或处罚。</p>
                  <p>3.3流量主不得擅自更改接单推广信息，包括但不限于标题、图片、视频、音频、文字等（与AiToEarn任务市场工作人员沟通确认后的更改除外），如擅自更改将不予结算并影响接单权限。</p>
                  <p>3.4AiToEarn任务市场订单实行发布后结算方式，结算金额实时到达流量主AiToEarn账户，流量主自行提现操作，平台不收取提现服务费。</p>
                </div>
              </div>

              <div className={styles.faqItem}>
                <h4>违规提示或账号封禁怎么处理？</h4>
                <div className={styles.faqAnswer}>
                  <p>将订单号和违规截图私聊发给工作人员。</p>
                  <p>如未回复消息请耐心等待（工作时间：工作日9:00-18:00）</p>
                  <p>前往爱优赚查看更多新媒体相关信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
