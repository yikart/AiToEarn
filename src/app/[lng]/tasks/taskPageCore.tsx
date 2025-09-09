"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Card, Button, List, Tag, message, Spin, Empty, Modal, Input, Row, Col, Image, Tooltip } from "antd";
import { CheckOutlined, ClockCircleOutlined, PlayCircleOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  apiGetTaskOpportunityList, 
  apiGetUserTaskList, 
  apiAcceptTask, 
  apiSubmitTask,
  TaskOpportunity,
  UserTask
} from "@/api/task";
import { apiCreatePublish } from "@/api/plat/publish";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { getOssUrl } from "@/utils/oss";
import { getAppDownloadConfig, getTasksRequiringApp } from "@/app/config/appDownloadConfig";
import DownloadAppModal from "@/components/common/DownloadAppModal";
import { getAccountListApi } from "@/api/account";
import { SocialAccount } from "@/api/types/account.type";
import { getTaskDetail, acceptTask, submitTask } from "@/api/notification";
import { getDays, getUtcDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";
import { Steps } from "antd";
import styles from "./taskPageCore.module.scss";

const { TabPane } = Tabs;

export default function TaskPageCore() {
  const { t } = useTransClient("common");
  const token = useUserStore((state) => state.token);
  
  // 如果未登录，显示登录提示
  if (!token) {
    return (
      <div className={styles.taskPage}>
        <div className={styles.header}>
          <h1>任务中心</h1>
          <p>请先登录以查看任务</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description="请先登录" />
        </div>
      </div>
    );
  }
  
  // 状态管理
  const [activeTab, setActiveTab] = useState("pending"); // pending: 待接受, accepted: 已接受
  const [pendingTasks, setPendingTasks] = useState<TaskOpportunity[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskOpportunity | null>(null);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  
  // 新增状态
  const [accountList, setAccountList] = useState<SocialAccount[]>([]);
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  
  // 任务进度弹窗状态
  const [taskProgressVisible, setTaskProgressVisible] = useState(false);
  const [taskProgress, setTaskProgress] = useState({
    currentStep: 0,
    steps: [
      { title: '正在接受任务...', status: 'processing' },
      { title: '正在发布任务...', status: 'wait' },
      { title: '正在提交任务...', status: 'wait' },
      { title: '任务完成', status: 'wait' }
    ]
  });
  
  // 下载App弹窗状态 - 暂时注释
  const [downloadAppVisible, setDownloadAppVisible] = useState(false);
  const [downloadAppConfig, setDownloadAppConfig] = useState({
    platform: "",
    appName: "",
    downloadUrl: "",
    qrCodeUrl: "" as string | undefined
  });

  // 获取待接受任务列表
  const fetchPendingTasks = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiGetTaskOpportunityList({ page: 1, pageSize: 20 });
      if (response && response.data) {
        setPendingTasks(response.data.list || []);
      } else {
        setPendingTasks([]);
      }
    } catch (error) {
      console.error("获取待接受任务失败:", error);
      message.error("获取待接受任务失败");
      setPendingTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取已接受任务列表
  const fetchAcceptedTasks = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiGetUserTaskList({ page: 1, pageSize: 20 });
      if (response && response.data) {
        setAcceptedTasks(response.data.list || []);
      } else {
        setAcceptedTasks([]);
      }
    } catch (error) {
      console.error("获取已接受任务失败:", error);
      message.error("获取已接受任务失败");
      setAcceptedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 获取账号列表
  const fetchAccountList = async () => {
    if (!token) {
      setAccountList([]);
      return;
    }

    try {
      const response = await getAccountListApi();
      if (response && response.data) {
        setAccountList(response.data || []);
      }
    } catch (error) {
      console.error("获取账号列表失败:", error);
    }
  };

  // 接受任务
  const handleAcceptTask = async (task: any ) => {
    // 暂时简化，直接接受任务
    await doAcceptTask(task);
    
    // TODO: 添加平台限制检查
    // if (!task.accountTypes || task.accountTypes.length === 0) {
    //   // 没有账号类型限制，直接接取任务
    //   await doAcceptTask(task);
    //   return;
    // }

    // // 检查需要App操作的平台
    // const appRequiredPlatforms = getTasksRequiringApp(task.accountTypes);
    
    // if (appRequiredPlatforms.length > 0) {
    //   // 有需要App操作的平台，显示第一个平台的下载提示
    //   const firstPlatform = appRequiredPlatforms[0];
    //   const config = getAppDownloadConfig(firstPlatform);
      
    //   if (config) {
    //     setDownloadAppConfig({
    //       platform: config.platform,
    //       appName: config.appName,
    //       downloadUrl: config.downloadUrl,
    //       qrCodeUrl: config.qrCodeUrl
    //     });
    //     setDownloadAppVisible(true);
    //     return;
    //   }
    // }
    
    // // 其他任务类型正常接取
    // await doAcceptTask(task);
  };

  // 执行接受任务
  const doAcceptTask = async (task: TaskOpportunity) => {
    try {
      const response = await apiAcceptTask(task.id);
      if (response && response.code === 0) {
        message.success("接受任务成功！");
        // 刷新任务列表
        fetchPendingTasks();
        fetchAcceptedTasks();
        // 切换到已接受任务标签
        setActiveTab("accepted");
      } else {
        message.error("接受任务失败");
      }
    } catch (error) {
      message.error("接受任务失败");
      console.error("接受任务失败:", error);
    }
  };

  // 提交任务
  const handleSubmitTask = async (userTask: UserTask) => {
    setSelectedTask(userTask as any);
    setSubmissionUrl("");
    setSubmitModalVisible(true);
  };

  // 确认提交任务
  const confirmSubmitTask = async () => {
    if (!selectedTask || !submissionUrl.trim()) {
      message.error("请输入提交链接");
      return;
    }

    try {
      setSubmittingTaskId(selectedTask.id);
      
      // 先发布任务
      const publishResponse = await apiCreatePublish({
        flowId: selectedTask.id,
        type: 'video' as any, // 根据任务类型设置
        accountId: selectedTask.accountId,
        accountType: selectedTask.accountType as any,
        desc: `任务提交: ${selectedTask.taskId}`,
        title: `任务提交`,
        topics: [],
        option: {}
      });

      if (publishResponse && publishResponse.code === 0) {
        // 发布成功后提交任务
        const submitResponse = await apiSubmitTask(selectedTask.id, submissionUrl);
        if (submitResponse && submitResponse.code === 0) {
          message.success("任务提交成功！");
          setSubmitModalVisible(false);
          fetchAcceptedTasks();
        } else {
          message.error("任务提交失败");
        }
      } else {
        message.error("发布任务失败");
      }
    } catch (error) {
      message.error("任务提交失败");
      console.error("任务提交失败:", error);
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // 获取平台显示名称
  const getPlatformName = (type: string) => {
    const platformNames: Record<string, string> = {
      'tiktok': 'TikTok',
      'youtube': 'YouTube', 
      'twitter': 'Twitter',
      'bilibili': '哔哩哔哩',
      'KWAI': '快手',
      'douyin': '抖音',
      'xhs': '小红书',
      'wxSph': '微信视频号',
      'wxGzh': '微信公众号',
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'threads': 'Threads',
      'pinterest': 'Pinterest',
    };
    return platformNames[type] || type;
  };

  // 获取任务类型显示名称
  const getTaskTypeName = (type: string) => {
    const taskTypeNames: Record<string, string> = {
      'video': '视频',
      'article': '图文',
      'article2': '纯文字',
    };
    return taskTypeNames[type] || type;
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 获取任务状态标签
  const getTaskStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'pending': { color: 'orange', text: '待接受' },
      'accepted': { color: 'blue', text: '已接受' },
      'completed': { color: 'green', text: '已完成' },
      'rejected': { color: 'red', text: '已拒绝' },
    };
    return statusMap[status] || { color: 'default', text: status };
  };

  // 根据accountId获取账号信息
  const getAccountById = (accountId: string): SocialAccount | null => {
    return accountList.find(account => account.id === accountId) || null;
  };

  // 获取平台图标
  const getPlatformIcon = (accountType: string) => {
    const platInfo = AccountPlatInfoMap.get(accountType as PlatType);
    return platInfo?.icon || '';
  };

  // 查看任务详情
  const handleViewTaskDetail = async (opportunityId: string) => {
    try {
      setTaskDetailLoading(true);
      const response: any = await getTaskDetail(opportunityId);
      if (response && response.data && response.code === 0) {
        setTaskDetail(response.data);
        setTaskDetailModalVisible(true);
      } else {
        message.error("获取任务详情失败");
      }
    } catch (error) {
      message.error("获取任务详情失败");
      console.error("获取任务详情失败:", error);
    } finally {
      setTaskDetailLoading(false);
    }
  };

  // 从任务详情接受任务
  const handleAcceptTaskFromDetail = async (task: any) => {
    if (!task) return;
    
    // 关闭详情弹窗
    setTaskDetailModalVisible(false);
    
    // 显示进度弹窗
    setTaskProgressVisible(true);
    setTaskProgress({
      currentStep: 0,
      steps: [
        { title: '正在接受任务...', status: 'processing' },
        { title: '正在发布任务...', status: 'wait' },
        { title: '正在提交任务...', status: 'wait' },
        { title: '任务完成', status: 'wait' }
      ]
    });
    
    try {
      // 第一步：接受任务
      const response: any = await acceptTask(task.id, task.opportunityId);
      if (response && response.code === 0) {
        // 更新进度：第一步完成，开始第二步
        setTaskProgress(prev => ({
          ...prev,
          currentStep: 1,
          steps: [
            { title: '正在接受任务...', status: 'finish' },
            { title: '正在发布任务...', status: 'processing' },
            { title: '正在提交任务...', status: 'wait' },
            { title: '任务完成', status: 'wait' }
          ]
        }));

        // 第二步：发布任务
        const publishAccount = getAccountById(task.accountId);
        if (publishAccount) {
          // 处理素材链接，确保使用完整链接
          const processedMaterials = task.materials?.map((material: any) => ({
            ...material,
            coverUrl: material.coverUrl ? getOssUrl(material.coverUrl) : undefined,
            mediaList: material.mediaList?.map((media: any) => ({
              ...media,
              url: getOssUrl(media.url),
              coverUrl: media.coverUrl ? getOssUrl(media.coverUrl) : undefined
            }))
          }));

          const publishData = {
            flowId: publishAccount.uid, // 使用账号的uid作为flowId
            accountType: publishAccount.type,
            accountId: publishAccount.account,
            title: task.title,
            desc: task.description,
            type: task.type as any, // 转换为PubType
            // 处理素材数据
            videoUrl: processedMaterials?.[0]?.mediaList?.[0]?.type === 'video' ? 
                     getOssUrl(processedMaterials[0].mediaList[0].url) : undefined,
            coverUrl: processedMaterials?.[0]?.coverUrl,
            imgUrlList: processedMaterials?.flatMap((material: any) => 
              material.mediaList?.filter((media: any) => media.type !== 'video')
                .map((media: any) => getOssUrl(media.url)) || []
            ),
            option: {},
            topics: [],
            publishTime: getUtcDays(getDays().add(6, "minute")).format()
          };

          const publishResponse: any = await apiCreatePublish(publishData);
          if (publishResponse && publishResponse.code === 0) {
            // 更新进度：第二步完成，开始第三步
            setTaskProgress(prev => ({
              ...prev,
              currentStep: 2,
              steps: [
                { title: '正在接受任务...', status: 'finish' },
                { title: '正在发布任务...', status: 'finish' },
                { title: '正在提交任务...', status: 'processing' },
                { title: '任务完成', status: 'wait' }
              ]
            }));

            // 第三步：提交任务
            const userTaskId = response.data.id;
            const submitResponse: any = await submitTask(userTaskId);
            
            if (submitResponse && submitResponse.code === 0) {
              // 更新进度：第三步完成，开始第四步
              setTaskProgress(prev => ({
                ...prev,
                currentStep: 3,
                steps: [
                  { title: '正在接受任务...', status: 'finish' },
                  { title: '正在发布任务...', status: 'finish' },
                  { title: '正在提交任务...', status: 'finish' },
                  { title: '任务完成', status: 'finish' }
                ]
              }));

              // 延迟1秒后关闭进度窗口并刷新任务列表
              setTimeout(() => {
                setTaskProgressVisible(false);
                setTaskDetail(null);
                fetchPendingTasks();
                fetchAcceptedTasks();
                setActiveTab("accepted");
              }, 1000);
            } else {
              throw new Error('提交任务失败');
            }
          } else {
            throw new Error('发布任务失败');
          }
        } else {
          throw new Error('找不到发布账号信息');
        }
      } else {
        throw new Error('接受任务失败');
      }
    } catch (error) {
      console.error("任务处理失败:", error);
      message.error("任务处理失败");
      setTaskProgressVisible(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingTasks();
      fetchAcceptedTasks();
      fetchAccountList();
    }
  }, [token]);

  return (
    <div className={styles.taskPage}>
      <div className={styles.header}>
        <h1>任务中心</h1>
        <p>接受任务，完成任务，获得奖励</p>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane 
          tab={
            <span>
              <ClockCircleOutlined />
              待接受任务
            </span>
          } 
          key="pending"
        >
          <Spin spinning={loading}>
            {pendingTasks.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {pendingTasks.map((task: any) => {
                  const publishAccount = getAccountById(task.accountId);
                  return (
                    <Card 
                      key={task.id} 
                      className={styles.taskCard}
                      style={{ marginBottom: 0 }}
                    >
                      <div className={styles.taskHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src={getPlatformIcon(task.accountType)} 
                            alt="platform"
                            style={{ width: '24px', height: '24px' }}
                          />
                          <h3 style={{ margin: 0, fontSize: '16px' }}>
                            {getPlatformName(task.accountType)}任务
                          </h3>
                        </div>
                        <Tag color="orange">待接受</Tag>
                      </div>
                      
                      <div className={styles.taskContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span><strong>发布时间：</strong>{formatTime(task.createdAt)}</span>
                          <span><strong>结束时间：</strong>{formatTime(task.expiredAt)}</span>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <strong>奖励：</strong>
                          <span style={{ color: '#f50', fontWeight: 'bold' }}>¥{task.reward}</span>
                        </div>
                        
                        {/* 发布账号信息 */}
                        {publishAccount && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            padding: '8px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            marginBottom: '12px'
                          }}>
                            <img
                              src={publishAccount.avatar ? getOssUrl(publishAccount.avatar) : '/default-avatar.png'}
                              alt="账号头像"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.png';
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                {publishAccount.nickname}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {getPlatformName(publishAccount.type)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.taskActions}>
                        <Button 
                          type="primary" 
                          onClick={() => handleViewTaskDetail(task.id)}
                          icon={<EyeOutlined />}
                          style={{ width: '100%' }}
                        >
                          查看详情
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Empty description="暂无待接受任务" />
            )}
          </Spin>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <PlayCircleOutlined />
              已接受任务
            </span>
          } 
          key="accepted"
        >
          <Spin spinning={loading}>
            {acceptedTasks.length > 0 ? (
              <List
                dataSource={acceptedTasks}
                renderItem={(task: any) => (
                  <List.Item>
                    <Card className={styles.taskCard}>
                      <div className={styles.taskHeader}>
                        <h3>{task.taskId}</h3>
                        <Tag color={getTaskStatusTag(task.status).color}>
                          {getTaskStatusTag(task.status).text}
                        </Tag>
                      </div>
                      <div className={styles.taskContent}>
                        <p><strong>账号类型：</strong>
                          <Tag color="blue" style={{ marginLeft: '4px' }}>
                            {getPlatformName(task.accountType)}
                          </Tag>
                        </p>
                        <p><strong>奖励：</strong>¥{task.reward}</p>
                        <p><strong>保持时间：</strong>{task.keepTime}秒</p>
                        {task.submissionUrl && (
                          <p><strong>提交链接：</strong>
                            <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer">
                              {task.submissionUrl}
                            </a>
                          </p>
                        )}
                      </div>
                      <div className={styles.taskActions}>
                        {task.status === 'accepted' && (
                          <Button 
                            type="primary" 
                            onClick={() => handleSubmitTask(task)}
                            icon={<UploadOutlined />}
                          >
                            提交任务
                          </Button>
                        )}
                        {task.submissionUrl && (
                          <Tooltip title="查看提交内容">
                            <Button 
                              icon={<EyeOutlined />}
                              onClick={() => window.open(task.submissionUrl, '_blank')}
                            >
                              查看
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无已接受任务" />
            )}
          </Spin>
        </TabPane>
      </Tabs>

      {/* 提交任务弹窗 */}
      <Modal
        title="提交任务"
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        onOk={confirmSubmitTask}
        confirmLoading={submittingTaskId !== null}
        okText="确认提交"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <label>提交链接：</label>
          <Input
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            placeholder="请输入任务完成后的链接"
            style={{ marginTop: '8px' }}
          />
        </div>
        <p style={{ color: '#666', fontSize: '12px' }}>
          请确保您已经完成了任务要求，并提供了正确的提交链接。
        </p>
      </Modal>

      {/* 任务详情弹窗 */}
      <Modal
        title="任务详情"
        open={taskDetailModalVisible}
        onCancel={() => {
          setTaskDetailModalVisible(false);
          setTaskDetail(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setTaskDetailModalVisible(false);
            setTaskDetail(null);
          }} type="primary">
            关闭
          </Button>
        ]}
        width={800}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px'
          },
          body: {
            padding: '24px'
          }
        }}
      >
        <Spin spinning={taskDetailLoading}>
          {taskDetail ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h3>{taskDetail.title}</h3>
                <Tag color={taskDetail.status === 'active' ? 'green' : 'red'}>
                  {taskDetail.status === 'active' ? '进行中' : '已结束'}
                </Tag>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <p><strong>描述：</strong>
                  <div dangerouslySetInnerHTML={{ __html: taskDetail.description }} />
                </p>
                
                {/* 发布账号信息 */}
                {taskDetail.accountId && (() => {
                  const publishAccount = getAccountById(taskDetail.accountId);
                  return publishAccount ? (
                    <p><strong>发布账号：</strong>
                      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px', gap: '8px' }}>
                        <img
                          src={publishAccount.avatar ? getOssUrl(publishAccount.avatar) : '/default-avatar.png'}
                          alt="账号头像"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                        <Tag color="green">
                          {getPlatformName(publishAccount.type)} - {publishAccount.nickname}
                        </Tag>
                      </div>
                    </p>
                  ) : (
                    <p><strong>发布账号：</strong>
                      <Tag color="red" style={{ marginLeft: '4px' }}>
                        账号信息获取失败
                      </Tag>
                    </p>
                  );
                })()}
                
                <p><strong>奖励：</strong>¥{taskDetail.reward}</p>
                <p><strong>任务类型：</strong>
                  <Tag color="blue" style={{ marginLeft: '4px' }}>
                    {getTaskTypeName(taskDetail.type)}
                  </Tag>
                </p>
              </div>
              
              {taskDetail.status === 'active' && taskDetail.currentRecruits < taskDetail.maxRecruits && (
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={() => handleAcceptTaskFromDetail(taskDetail)}
                    style={{ marginTop: '12px' }}
                  >
                    接受任务
                  </Button>
                </div>
              )}
            </div>
          ) : !taskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              暂无任务详情
            </div>
          )}
        </Spin>
      </Modal>

      {/* 任务进度弹窗 */}
      <Modal
        title="任务处理中..."
        open={taskProgressVisible}
        closable={false}
        maskClosable={false}
        footer={null}
        width={500}
        zIndex={3000}
        styles={{
          body: {
            padding: '24px'
          }
        }}
      >
        <Steps
          direction="vertical"
          current={taskProgress.currentStep}
          items={taskProgress.steps.map((step, index) => ({
            title: step.title,
            status: step.status as 'wait' | 'process' | 'finish' | 'error',
            description: index === 0 ? '正在调用接受任务接口...' : 
                        index === 1 ? '正在调用发布任务接口...' : 
                        index === 2 ? '正在调用提交任务接口...' :
                        '任务处理完成，即将跳转...'
          }))}
        />
      </Modal>

      {/* 下载App提示弹窗 */}
      <DownloadAppModal
        visible={downloadAppVisible}
        onClose={() => setDownloadAppVisible(false)}
        platform={downloadAppConfig.platform}
        appName={downloadAppConfig.appName}
        downloadUrl={downloadAppConfig.downloadUrl}
        qrCodeUrl={downloadAppConfig.qrCodeUrl}
      />
    </div>
  );
}
