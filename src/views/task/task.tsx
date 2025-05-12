/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 任务页面
 */
import { useState, useEffect, useRef } from 'react';
import {
  HistoryOutlined,
  WalletOutlined,
  CommentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import {
  Card,
  List,
  Typography,
  Button,
  Space,
  Tag,
  Spin,
  Modal,
  Descriptions,
  message,
  Progress,
  Image,
  notification,
  Row,
  Col,
  Carousel,
} from 'antd';
import { useInView } from 'react-intersection-observer';
import styles from './task.module.scss';

// 导入现有的任务组件
import MineTask from './mineTask';
// import TaskInfo from './components/TaskInfo';
import TaskInfo from './components/popInfo';
// 移除 InteractionTask 导入
// import InteractionTask from './interactionTask';

import { useNavigate } from 'react-router-dom';
import { taskApi } from '@/api/task';
import { TaskType, TaskVideo, TaskTypeName } from '@@/types/task';
import dayjs from 'dayjs';
import { TaskInfoRef } from './components/popInfo';
import ChooseAccountModule from '@/views/publish/components/ChooseAccountModule/ChooseAccountModule';
import { PubType } from '@@/publish/PublishEnum';
import { icpCreateInteractionOneKey } from '@/icp/replyother';
import { onInteractionProgress } from '../../icp/receiveMsg';
import {
  icpCreatePubRecord,
  icpCreateImgTextPubRecord,
  icpPubImgText,
} from '@/icp/publish';
import { usePubStroe } from '@/store/pubStroe';
import { useAccountStore } from '@/store/commont';

// 导入平台图标
import KwaiIcon from '../../assets/svgs/account/ks.svg';
import WxSphIcon from '../../assets/svgs/account/wx-sph.svg';
import XhsIcon from '../../assets/svgs/account/xhs.svg';
import DouyinIcon from '../../assets/svgs/account/douyin.svg';
import logo from '@/assets/logo.png';
import { useImagePageStore } from '../publish/children/imagePage/useImagePageStore';
import { useShallow } from 'zustand/react/shallow';

const { Title, Text } = Typography;

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_HOST;

// 平台配置
const platformConfig = {
  KWAI: {
    name: '快手',
    icon: KwaiIcon,
    color: '#FF4D4F',
  },
  wxSph: {
    name: '微信视频号',
    icon: WxSphIcon,
    color: '#07C160',
  },
  xhs: {
    name: '小红书',
    icon: XhsIcon,
    color: '#FF2442',
  },
  douyin: {
    name: '抖音',
    icon: DouyinIcon,
    color: '#000000',
  },
};

// 任务类型定义
interface Task {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  likes: number;
  views: number;
  level: string;
}

export default function Task() {
  const navigate = useNavigate();
  // 当前选中的任务类型
  const [activeTab, setActiveTab] = useState('interaction');

  // 互动任务相关状态
  const [loading, setLoading] = useState(false);
  const [taskList, setTaskList] = useState<any[]>([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
  });
  const [hasMore, setHasMore] = useState(true);
  const selectedTaskRef = useRef<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [chooseAccountOpen, setChooseAccountOpen] = useState(false);
  const [accountListChoose, setAccountListChoose] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const Ref_TaskInfo = useRef<TaskInfoRef>(null);
  const [pubProgressModuleOpen, setPubProgressModuleOpen] = useState(false);

  // 使用 react-intersection-observer 监听底部元素
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    rootMargin: '100px 0px',
  });

  // 当底部元素进入视图时加载更多数据
  useEffect(() => {
    if (inView && hasMore && !loading && activeTab === 'interaction') {
      loadMore();
    }
  }, [inView, hasMore, loading, activeTab]);

  // 加载更多数据
  const loadMore = async () => {
    console.log('loadMore方法被调用');
    if (loading || !hasMore) {
      console.log('loadMore被阻止: loading=', loading, 'hasMore=', hasMore);
      return;
    }

    setLoading(true);
    try {
      const nextPage = pageInfo.page + 1;
      console.log('加载下一页:', nextPage);
      setPageInfo((prev) => ({ ...prev, page: nextPage }));
      await getTaskList(true);
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取任务列表
  async function getTaskList(isLoadMore = false) {
    setLoading(true);
    try {
      const res = await taskApi.getTaskList<any>(pageInfo);

      if (isLoadMore) {
        setTaskList((prev) => [...prev, ...res.items]);
      } else {
        setTaskList(res.items);
      }

      setPageInfo((prev) => ({
        ...prev,
        totalCount: (res as any).meta.totalItems,
      }));

      // 恢复设置 hasMore 的代码
      const totalCount = (res as any).meta.totalItems || 0;
      const currentPage = (res as any).meta.currentPage;
      const pageSize = pageInfo.pageSize;
      const hasMoreItems = currentPage * pageSize < totalCount;

      console.log('计算hasMore:', {
        totalCount,
        currentPage,
        pageSize,
        hasMoreItems,
      });

      setHasMore(hasMoreItems);
    } catch (error) {
      console.error('获取任务列表失败', error);
    } finally {
      setLoading(false);
    }
  }

  // 初始加载数据
  useEffect(() => {
    // if (activeTab === 'interaction') {
    //   setPageInfo({
    //     page: 1,
    //     pageSize: 2,
    //     totalCount: 0,
    //   });
    //   getTaskList();
    // }
  }, [activeTab]);

  // 任务进度监听
  useEffect(() => {
    const unload = onInteractionProgress((args) => {
      if (args.status === 1) {
        taskDone();
        notification.open({
          message: '互动任务完成',
        });
      }
    });
    return () => {
      unload();
    };
  }, []);

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
  };

  const getPlatformTags = (accountTypes: string[]) => {
    if (!accountTypes || accountTypes.length === 0) return null;

    return accountTypes.map((type) => {
      const platform = platformConfig[type as keyof typeof platformConfig];
      if (!platform) return null;

      return (
        <div
          key={type}
          className={styles.platformIconWrapper}
          style={{ backgroundColor: platform.color }}
        >
          <img
            src={platform.icon}
            className={styles.platformIcon}
            alt={platform.name}
          />
        </div>
      );
    });
  };

  const { setCommonPubParams } = useImagePageStore(
    useShallow((state) => ({
      setCommonPubParams: state.setCommonPubParams,
    })),
  );
  // TODO 完善跳转逻辑
  const handleJoinTask = (task: any) => {
    if (task.isAccepted) {
      setActiveTab('mine');
      return;
    }

    // setCommonPubParams({
    //   title: "标题1",
    //   describe: "描述1",
    //   topics: ["话题1","话题2"],
    // });
    // navigate('/publish/image');
    // return;
    // console.log('task@:', task);
    setSelectedTask(task);

    // 根据任务类型选择不同的处理逻辑
    if (task.type === TaskType.ARTICLE || task.type === TaskType.INTERACTION) {
      // 文章任务和互动任务使用模态框
      setModalVisible(true);
    } else {
      // 其他任务使用 TaskInfo 组件
      Ref_TaskInfo.current?.init(task);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    setModalVisible(false);

    // 根据任务类型选择不同的处理逻辑
    if (selectedTask.type === TaskType.ARTICLE) {
      // 文章任务使用 pubCore 逻辑
      setChooseAccountOpen(true);
    } else {
      // 其他任务使用原有的互动任务逻辑
      setChooseAccountOpen(true);
    }
  };

  // 在组件内添加一个新的状态来存储任务记录
  const [taskRecord, setTaskRecord] = useState<{
    _id: string;
    createTime: string;
    isFirstTimeSubmission: boolean;
    status: string;
    taskId: string;
  } | null>(null);

  /**
   * 接受任务
   */
  async function taskApply() {
    // 00.00 测试
    if (!selectedTask) return;

    try {
      const res: any = await taskApi.taskApply<TaskVideo>(selectedTask?._id);

      // const res: any = {
      //   code: 0,
      //   data: {
      //   }
      // }

      // 存储任务记录信息 00.00
      // console.log('jieshou :', res);
      if (res.code == 0 && res.data) {
        setTaskRecord(res.data);
        message.success('任务接受成功！');

        // handleCompleteTask();

        // console.log('selectedTask.dataInfo', selectedTask.dataInfo);

        if (selectedTask.type == TaskType.ARTICLE) {
          setCommonPubParams({
            title: selectedTask.dataInfo?.title || '',
            describe: selectedTask.dataInfo?.desc || '',
            topics: selectedTask.dataInfo?.topicList || [],
          });
          navigate('/publish/image');
        }

        // return;
      } else {
        message.error(res.msg || '接受任务失败，请稍后再试?');
      }
    } catch (error) {
      message.error('接受任务失败，请稍后再试');
    }
  }

  async function taskApplyoney() {
    console.log('------ taskApplyoney', selectedTask);
    if (!selectedTask) return;

    try {
      const res: any = await taskApi.taskApply<TaskVideo>(selectedTask?._id);
      // 存储任务记录信息 00.00
      // console.log('jieshou :', res);
      if (res.code == 0 && res.data) {
        setTaskRecord(res.data);
        setModalVisible(false);
        message.success('任务接受成功！');
      } else {
        message.error(res.msg || '接受任务失败，请稍后再试?');
      }
    } catch (error) {
      message.error('接受任务失败，请稍后再试');
    }
  }

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  /**
   * 完成任务
   */
  async function taskDone() {
    console.log('taskDone执行:', selectedTaskRef.current);
    if (!selectedTaskRef.current) return;
    const selectedTask = selectedTaskRef.current;
    if (!selectedTask || !taskRecord) {
      // message.error('任务信息不完整，无法完成任务');
      return;
    }

    try {
      // 使用任务记录的 ID 而不是任务 ID
      const res = await taskApi.taskDone(taskRecord._id, {
        submissionUrl: selectedTask.title,
        screenshotUrls: [selectedTask.dataInfo?.imageList?.[0] || ''],
        qrCodeScanResult: selectedTask.title,
      });
      message.success('任务发布成功！');
      refreshTaskList();
    } catch (error) {
      message.error('完成任务失败，请稍后再试');
    }
  }

  // 文章任务的发布核心逻辑
  const pubCore = async (account: any) => {
    if (!selectedTask) return;

    setPubProgressModuleOpen(true);
    setLoading(true);
    const err = () => {
      setLoading(false);
      message.error('网络繁忙，请稍后重试！');
    };

    // 00.00 测试
    // console.log('pubCore', selectedTask);
    // return;

    // 创建一级记录
    const recordRes = await icpCreatePubRecord({
      title: selectedTask.title,
      desc: selectedTask.description,
      type: PubType.ImageText,
      coverPath: FILE_BASE_URL + (selectedTask.dataInfo?.imageList?.[0] || ''),
    });
    if (!recordRes) return err();

    let pubList = [];
    if (selectedTask.dataInfo?.imageList?.length > 1) {
      pubList = selectedTask.dataInfo?.imageList.map(
        (v: string) => FILE_BASE_URL + v,
      );
    }

    console.log('pubList', pubList);
    console.log(accountListChoose);
    const allAccount = accountListChoose?.length
      ? accountListChoose
      : [account];
    console.log(allAccount);

    for (const account of allAccount) {
      // 创建二级记录
      await icpCreateImgTextPubRecord({
        title: selectedTask.title,
        desc: selectedTask.description,
        type: account.type,
        accountId: account.id,
        pubRecordId: recordRes.id,
        publishTime: new Date(),
        coverPath:
          FILE_BASE_URL + (selectedTask.dataInfo?.imageList?.[0] || ''),
        imagesPath: pubList,
      });
    }

    const okRes = await icpPubImgText(recordRes.id);

    if (okRes.length > 0) {
      taskDone();
    }

    setLoading(false);
    setPubProgressModuleOpen(false);
    usePubStroe.getState().clearImgTextPubSave();
    const successList = okRes.filter((v) => v.code === 1);
    useAccountStore.getState().notification!.open({
      message: '发布结果',
      description: (
        <>
          一共发布 {okRes.length} 条数据，成功 {successList.length} 条，失败{' '}
          {okRes.length - successList.length} 条
        </>
      ),
      showProgress: true,
      actions: [
        <Button
          key="view"
          type="primary"
          size="small"
          onClick={() => {
            navigate('/publish/pubRecord');
          }}
        >
          查看发布记录
        </Button>,
      ],
      key: Date.now(),
    });
  };

  const handleInteraction = async (account: any) => {
    console.log('account', account.id);
    console.log('selectedTask', selectedTask.dataInfo);
    console.log('selectedTask.description', selectedTask.description);
    console.log('selectedTask.accountTypes', account.type);

    const option: any = {
      platform: account.type,
    };

    if (selectedTask.dataInfo?.commentContent) {
      option.commentContent = selectedTask.dataInfo?.commentContent;
    }

    try {
      setLoading(true);
      const res: any = await icpCreateInteractionOneKey(
        account.id,
        [
          {
            dataId: selectedTask.dataInfo?.worksId,
            readCount: 0,
            likeCount: 0,
            collectCount: 0,
            forwardCount: 0,
            commentCount: 0, // 评论数量
            income: 0,
            title: selectedTask.dataInfo?.title || '',
            desc: selectedTask.dataInfo?.title || '',
            authorId: selectedTask.dataInfo?.authorId || '',
            author: {
              id: selectedTask.dataInfo?.authorId || '',
            },
            option: {
              xsec_token: 'ABQgeOn-14sjhmCALp9dEISLZrOOyDdGZwKtr2umjsWeo=',
            },
          },
        ],
        option,
      );

      console.log('handleInteraction', 'res', res);

      // if (res.code === 1) {
      //   message.success('互动任务完成成功');
      //   // 更新任务状态
      //   setTaskList(prev => prev.map(task =>
      //     task._id === selectedTask._id ? { ...task, isAccepted: true } : task
      //   ));
      // } else {
      //   message.error('互动任务完成失败');
      // }
    } catch (error) {
      console.error('互动任务失败', error);
      message.error('互动任务失败，请重试');
    } finally {
      setLoading(false);
      setChooseAccountOpen(false);
    }
  };

  // 处理账号选择确认
  const handleAccountConfirm = async (aList: any[]) => {
    console.log('账号:', aList);
    setAccountListChoose(aList);
    setChooseAccountOpen(false);

    // 根据任务类型选择不同的处理逻辑
    if (selectedTask?.type === TaskType.ARTICLE) {
      // 文章任务使用 pubCore 逻辑
      await pubCore(aList[0]);
    } else {
      // 其他任务使用原有的互动任务逻辑
      await handleInteraction(aList[0]);
    }
  };

  // 刷新任务列表的函数
  const refreshTaskList = () => {
    setPageInfo({
      pageSize: 20,
      page: 1,
      totalCount: 0,
    });
    getTaskList();
  };

  // 渲染对应的任务内容
  const renderTaskContent = () => {
    switch (activeTab) {
      case 'mine':
        return <MineTask />;
      case 'interaction':
        return renderInteractionTask();
      default:
        return renderInteractionTask();
    }
  };

  // 渲染互动任务内容
  const renderInteractionTask = () => {
    return (
      <div className={styles.taskList}>
        <ChooseAccountModule
          open={chooseAccountOpen}
          onClose={() => !downloading && setChooseAccountOpen(false)}
          platChooseProps={{
            choosedAccounts: accountListChoose,
            pubType: PubType.ImageText,
            allowPlatSet: new Set(selectedTask?.accountTypes || []) as any,
          }}
          onPlatConfirm={handleAccountConfirm}
        />

        <Spin spinning={loading}>
          <List
            grid={{
              gutter: 8,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 5,
              xxl: 6,
            }}
            dataSource={taskList}
            renderItem={(item) => (
              <List.Item>
                <Card
                  className={styles.taskCard}
                  variant="outlined"
                  cover={
                    <div className={styles.taskImage}>
                      <Image
                        src={
                          item.imageUrl
                            ? FILE_BASE_URL + item.imageUrl
                            : item.dataInfo?.imageList?.length
                              ? FILE_BASE_URL + item.dataInfo.imageList[0]
                              : logo
                        }
                        alt="logo"
                        preview={false}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'contain',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 1,
                        }}
                      >
                        <Tag color="blue">
                          {TaskTypeName.get(item.type as TaskType) ||
                            '未知任务'}
                        </Tag>
                      </div>
                    </div>
                  }
                  actions={[
                    // <Space key="recruits">
                    //   <UserOutlined />
                    //   <Text>
                    //     {item.currentRecruits}
                    //     {/* /{item.maxRecruits} */}
                    //   </Text>
                    // </Space>,
                    // <Space key="time">
                    //   <ClockCircleOutlined />
                    //   <Text>{item.keepTime}分钟</Text>
                    // </Space>,
                    <Button
                      type="primary"
                      key="join"
                      // disabled={item.isAccepted}
                      onClick={() => handleJoinTask(item)}
                      style={{ minWidth: '120px' }}
                    >
                      {item.isAccepted ? '去完成任务' : '参与任务'}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <div className={styles.taskTitle}>
                        <Title level={5}>{item.title}</Title>
                        <Space>
                          <Tag
                            color="green"
                            style={{ fontSize: '16px', padding: '1px 18px' }}
                          >
                            ¥{item.reward}
                          </Tag>
                          <Space size={4}>
                            {getPlatformTags(item.accountTypes)}
                          </Space>
                        </Space>
                      </div>
                    }
                    description={
                      <div className={styles.taskInfo}>
                        <div className={styles.taskProgress}>
                          {/* <Progress
                            percent={Math.round(
                              (item.currentRecruits / item.maxRecruits) * 100,
                            )}
                            size="small"
                            showInfo={false}
                          /> */}
                        </div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: item.description,
                          }}
                          className={styles.taskDescription}
                        />
                        {/* <Text type="secondary">
                          {item.description}
                        </Text> */}
                        {/* <div className={styles.taskDeadline}>
                          <Text type="secondary">
                            截止时间：{formatDate(item.deadline)}
                          </Text>
                        </div> */}
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </Spin>

        {/* 底部加载更多触发器 */}
        <div
          ref={loadMoreRef}
          className={styles.loadMoreTrigger}
          style={{ height: '50px', marginTop: '20px' }}
        >
          {hasMore ? (
            <div className={styles.loadMoreContainer}>
              <Button type="link" loading={loading} onClick={loadMore}>
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          ) : (
            <div className={styles.loadMoreContainer}>
              <Text style={{ color: '#999' }}>没有更多任务了</Text>
            </div>
          )}
        </div>

        <Modal
          title="任务详情"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={taskApplyoney}>
              领取
            </Button>,
            <Button
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={taskApply}
            >
              领取&发布
            </Button>,
          ]}
          width={700}
        >
          {selectedTask && (
            <div className={styles.taskDetail}>
              <Row gutter={[16, 6]}>
                <Col span={24}>
                  <div className={styles.taskDetailHeader}>
                    <Title level={4}>{selectedTask.title}</Title>
                    <Space>
                      <Tag color="blue">
                        {TaskTypeName.get(selectedTask.type as TaskType) ||
                          '未知任务'}
                      </Tag>
                      <Tag color="green">赚 ¥{selectedTask.reward}</Tag>
                    </Space>
                  </div>
                </Col>

                {/* 图片轮播展示 */}
                {selectedTask.dataInfo?.imageList &&
                  selectedTask.dataInfo.imageList.length > 0 && (
                    <Col span={24}>
                      <div className={styles.bannerContainer}>
                        <Carousel
                          autoplay
                          dots={true}
                          arrows={true}
                          className={styles.taskBanner}
                          dotPosition="bottom"
                        >
                          {selectedTask.dataInfo.imageList.map(
                            (image: string, index: number) => (
                              <div key={index} className={styles.bannerItem}>
                                <Image
                                  src={FILE_BASE_URL + image}
                                  alt={`任务图片 ${index + 1}`}
                                  preview={false}
                                  className={styles.bannerImage}
                                />
                              </div>
                            ),
                          )}
                        </Carousel>
                      </div>
                    </Col>
                  )}

                <Col span={24}>
                  {/* <Divider orientation="left">任务信息</Divider> */}
                  <Descriptions column={1} bordered>
                    {selectedTask.dataInfo?.title != '' && (
                      <Descriptions.Item label="发布标题">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: selectedTask.dataInfo?.title,
                          }}
                          className={styles.taskDescription}
                        />
                      </Descriptions.Item>
                    )}

                    {selectedTask.dataInfo?.desc ||
                      (selectedTask.dataInfo?.topicList?.length > 0 && (
                        <Descriptions.Item label="发布描述">
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                selectedTask.dataInfo?.desc ||
                                '' +
                                  (selectedTask.dataInfo?.topicList?.length > 0
                                    ? '<span style="color: #999; font-size: 12px; margin-left: 8px;">#' +
                                      selectedTask.dataInfo.topicList.join(
                                        ' #',
                                      ) +
                                      '</span>'
                                    : ''),
                            }}
                            className={styles.taskDescription}
                          />
                        </Descriptions.Item>
                      ))}

                    {selectedTask.type !== TaskType.ARTICLE && (
                      <Descriptions.Item label="评论内容">
                        {selectedTask.dataInfo?.commentContent || 'AI智能评论'}
                      </Descriptions.Item>
                    )}

                    {selectedTask.dataInfo?.worksId && (
                      <Descriptions.Item label="作品ID">
                        {selectedTask.dataInfo?.worksId || ''}
                      </Descriptions.Item>
                    )}

                    {/* <Descriptions.Item label="任务时长">
                      {selectedTask.keepTime}分钟
                    </Descriptions.Item> */}

                    {/* <Descriptions.Item label="起止时间">
                      {formatDate(selectedTask.createTime)} - {formatDate(selectedTask.deadline)}
                    </Descriptions.Item> */}

                    {/* <Descriptions.Item label="截止时间">
                      {formatDate(selectedTask.deadline)}
                    </Descriptions.Item> */}
                    {/* <Descriptions.Item label="参与人数">
                      <Progress
                        percent={Math.round(
                          (selectedTask.currentRecruits /
                            selectedTask.maxRecruits) *
                            100,
                        )}
                        size="small"
                        format={() =>
                          `${selectedTask.currentRecruits}/${selectedTask.maxRecruits}`
                        }
                      />
                    </Descriptions.Item> */}
                    <Descriptions.Item label="支持平台">
                      <Space size={4}>
                        {getPlatformTags(selectedTask.accountTypes)}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* 添加 TaskInfo 组件 */}
        <TaskInfo ref={Ref_TaskInfo} onTaskApplied={refreshTaskList} />
      </div>
    );
  };

  return (
    <div className={styles.taskPageContainer}>
      {/* 顶部导航栏 */}
      <div className={styles.taskHeader}>
        <div className={styles.taskHeaderLeft}>
          {/* <div
            className={`${styles.taskButton} ${activeTab === 'car' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('car')}
          >
            <ShoppingCartOutlined />
            <span>挂车市场任务</span>
          </div>
          <div
            className={`${styles.taskButton} ${activeTab === 'pop' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('pop')}
          >
            <ShareAltOutlined />
            <span>推广任务</span>
          </div>
          <div
            className={`${styles.taskButton} ${activeTab === 'video' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <VideoCameraOutlined />
            <span>视频任务</span>
          </div> */}
          {/* <div
            className={`${styles.taskButton} ${activeTab === 'article' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('article')}
          >
            <FileTextOutlined />
            <span>文章任务</span>
          </div> */}
          <div
            className={`${styles.taskButton} ${activeTab === 'interaction' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('interaction')}
          >
            <CommentOutlined />
            <span>任务市场</span>
          </div>
          <div
            className={`${styles.taskButton} ${activeTab === 'mine' ? styles.activeTaskButton : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            <HistoryOutlined />
            <span>已参与过任务</span>
          </div>
        </div>
        <div className={styles.taskHeaderRight}>
          <div
            className={styles.withdrawText}
            onClick={() => navigate('/finance')}
          >
            <WalletOutlined />
            <span>钱包</span>
          </div>
        </div>
      </div>

      {/* 任务内容 */}
      <div className={styles.taskContent}>{renderTaskContent()}</div>
    </div>
  );
}
