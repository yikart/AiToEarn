"use client";

import React, { useState, useEffect } from "react";
import { Tabs, Card, Button, List, Tag, message, Spin, Empty, Modal, Input, Row, Col, Image, Tooltip, Pagination } from "antd";
import { CheckOutlined, ClockCircleOutlined, PlayCircleOutlined, UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  apiGetTaskOpportunityList, 
  apiGetUserTaskList,
  apiGetUserTaskDetail, 
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
import http from "@/utils/request";
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
  
  // 分页状态
  const [pendingPagination, setPendingPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [acceptedPagination, setAcceptedPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [selectedTask, setSelectedTask] = useState<TaskOpportunity | null>(null);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  
  // 新增状态
  const [accountList, setAccountList] = useState<SocialAccount[]>([]);
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // 已接受任务详情弹窗状态
  const [acceptedTaskDetailModalVisible, setAcceptedTaskDetailModalVisible] = useState(false);
  const [acceptedTaskDetail, setAcceptedTaskDetail] = useState<any>(null);
  const [acceptedTaskDetailLoading, setAcceptedTaskDetailLoading] = useState(false);
  
  // 媒体预览弹窗状态
  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'video' | 'image';
    url: string;
    title?: string;
  } | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  
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
  const fetchPendingTasks = async (page: number = 1, pageSize: number = 20) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiGetTaskOpportunityList({ page, pageSize });
      if (response && response.data) {
        setPendingTasks(response.data.list || []);
        setPendingPagination(prev => ({
          ...prev,
          current: page,
          total: (response.data as any).total || 0
        }));
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
  const fetchAcceptedTasks = async (page: number = 1, pageSize: number = 20) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiGetUserTaskList({ page, pageSize });
      if (response && response.data) {
        setAcceptedTasks(response.data.list || []);
        setAcceptedPagination(prev => ({
          ...prev,
          current: page,
          total: (response.data as any).total || 0
        }));
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
      'pending': { color: 'orange', text: '待完成' },
      'doing': { color: 'green', text: '已完成' },
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

  // 查看已接受任务详情
  const handleViewAcceptedTaskDetail = async (taskId: string) => {
    try {
      setAcceptedTaskDetailLoading(true);
      setCurrentTaskId(taskId);
      const response: any = await apiGetUserTaskDetail(taskId);
      if (response && response.data && response.code === 0) {
        setAcceptedTaskDetail(response.data);
        setAcceptedTaskDetailModalVisible(true);
      } else {
        message.error("获取任务详情失败");
      }
    } catch (error) {
      message.error("获取任务详情失败");
      console.error("获取任务详情失败:", error);
    } finally {
      setAcceptedTaskDetailLoading(false);
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

  // 完成任务
  const handleCompleteTask = async () => {
    if (!currentTaskId) return;
    
    // 显示进度弹窗
    setTaskProgressVisible(true);
    setTaskProgress({
      currentStep: 0,
      steps: [
        { title: '正在完成任务...', status: 'processing' },
        { title: '正在发布任务...', status: 'wait' },
        { title: '正在提交任务...', status: 'wait' },
        { title: '任务完成', status: 'wait' }
      ]
    });
    
    try {
      // 第一步：完成任务（这里可能需要调用特定的API，暂时使用submitTask）
      const response: any = await submitTask(currentTaskId);
      if (response && response.code === 0) {
        // 更新进度：第一步完成，开始第二步
        setTaskProgress(prev => ({
          ...prev,
          currentStep: 1,
          steps: [
            { title: '正在完成任务...', status: 'finish' },
            { title: '正在发布任务...', status: 'processing' },
            { title: '正在提交任务...', status: 'wait' },
            { title: '任务完成', status: 'wait' }
          ]
        }));

        // 第二步：发布任务
        const publishAccount = getAccountById(acceptedTaskDetail.accountId);
        if (publishAccount) {
          // 处理素材链接，确保使用完整链接
          const processedMaterials = acceptedTaskDetail.task?.materials?.map((material: any) => ({
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
            title: acceptedTaskDetail.task?.title,
            desc: acceptedTaskDetail.task?.description,
            type: acceptedTaskDetail.task?.type as any, // 转换为PubType
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
                { title: '正在完成任务...', status: 'finish' },
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
                  { title: '正在完成任务...', status: 'finish' },
                  { title: '正在发布任务...', status: 'finish' },
                  { title: '正在提交任务...', status: 'finish' },
                  { title: '任务完成', status: 'finish' }
                ]
              }));

              // 延迟1秒后关闭进度窗口并刷新任务列表
              setTimeout(() => {
                setTaskProgressVisible(false);
                setAcceptedTaskDetailModalVisible(false);
                setAcceptedTaskDetail(null);
                setCurrentTaskId(null);
                fetchAcceptedTasks();
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
        throw new Error('完成任务失败');
      }
    } catch (error) {
      console.error("任务处理失败:", error);
      message.error("任务处理失败");
      setTaskProgressVisible(false);
    }
  };

  // 处理待接受任务分页变化
  const handlePendingPageChange = (page: number, pageSize?: number) => {
    fetchPendingTasks(page, pageSize || pendingPagination.pageSize);
  };

  // 处理已接受任务分页变化
  const handleAcceptedPageChange = (page: number, pageSize?: number) => {
    fetchAcceptedTasks(page, pageSize || acceptedPagination.pageSize);
  };

  // 处理媒体点击
  const handleMediaClick = (media: any, materialTitle?: string) => {
    if (media.type === 'video') {
      setPreviewMedia({
        type: 'video',
        url: getOssUrl(media.url),
        title: materialTitle
      });
    } else {
      setPreviewMedia({
        type: 'image',
        url: getOssUrl(media.url),
        title: materialTitle
      });
    }
    setMediaPreviewVisible(true);
  };

  // 处理视频封面点击
  const handleVideoCoverClick = (media: any, materialTitle?: string) => {
    setPreviewMedia({
      type: 'video',
      url: getOssUrl(media.url),
      title: materialTitle
    });
    setMediaPreviewVisible(true);
  };

  // 关闭媒体预览
  const handleCloseMediaPreview = () => {
    // 停止视频播放
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
    }
    setMediaPreviewVisible(false);
    setPreviewMedia(null);
    setVideoRef(null);
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
      {/* <div className={styles.header}>
        <h1>任务中心</h1>
        <p>接受任务，完成任务，获得奖励</p>
      </div> */}

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane 
          tab={
            <span>
              <ClockCircleOutlined />
              &nbsp; 待接受任务
            </span>
          } 
          key="pending"
        >
          <Spin spinning={loading}>
            {pendingTasks.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Pagination
                    current={pendingPagination.current}
                    pageSize={pendingPagination.pageSize}
                    total={pendingPagination.total}
                    onChange={handlePendingPageChange}
                    onShowSizeChange={handlePendingPageChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
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
              &nbsp; 已接受任务
            </span>
          } 
          key="accepted"
        >
          <Spin spinning={loading}>
            {acceptedTasks.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {acceptedTasks.map((task: any) => {
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
                        <Tag color={getTaskStatusTag(task.status).color}>
                          {getTaskStatusTag(task.status).text}
                        </Tag>
                      </div>
                      
                      <div className={styles.taskContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span><strong>接受时间：</strong>{formatTime(task.createdAt)}</span>
                          <span> </span>
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
                          onClick={() => handleViewAcceptedTaskDetail(task.id)}
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
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Pagination
                    current={acceptedPagination.current}
                    pageSize={acceptedPagination.pageSize}
                    total={acceptedPagination.total}
                    onChange={handleAcceptedPageChange}
                    onShowSizeChange={handleAcceptedPageChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </div>
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
              {/* 视频发布风格布局 */}
              <div style={{ 
                display: 'flex', 
                gap: '24px',
                marginBottom: '24px'
              }}>
                {/* 左侧：视频/媒体内容 */}
                <div style={{ flex: '0 0 400px' }}>
                  {taskDetail.materials && taskDetail.materials.length > 0 && (
                    <div style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      backgroundColor: '#000'
                    }}>
                      {taskDetail.materials[0].mediaList && taskDetail.materials[0].mediaList.length > 0 && (
                        <div style={{ position: 'relative', cursor: 'pointer' }}>
                          {taskDetail.materials[0].mediaList[0].type === 'video' ? (
                            <div 
                              style={{
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onClick={() => handleVideoCoverClick(taskDetail.materials[0].mediaList[0], taskDetail.title)}
                            >
                              {/* 视频封面图片 */}
                              <img
                                src={taskDetail.materials[0].coverUrl ? getOssUrl(taskDetail.materials[0].coverUrl) : getOssUrl(taskDetail.materials[0].mediaList[0].url)}
                                alt="video cover"
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block'
                                }}
                              />
                              {/* 播放按钮 */}
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontSize: '24px',
                                background: 'rgba(0,0,0,0.7)',
                                borderRadius: '50%',
                                width: '60px',
                                height: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}>
                                ▶
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getOssUrl(taskDetail.materials[0].mediaList[0].url)}
                              alt="media"
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                              }}
                              onClick={() => handleMediaClick(taskDetail.materials[0].mediaList[0], taskDetail.title)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 右侧：标题和描述 */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  {/* 标题区域 */}
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '20px', 
                      fontWeight: '600',
                      lineHeight: '1.4',
                      color: '#1a1a1a'
                    }}>
                      {taskDetail.title}
                    </h2>
                    
                    {/* 发布账号信息 */}
                    {taskDetail.accountId && (() => {
                      const publishAccount = getAccountById(taskDetail.accountId);
                      return publishAccount ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
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
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: '500',
                              color: '#1a1a1a'
                            }}>
                              {publishAccount.nickname}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666'
                            }}>
                              {getPlatformName(publishAccount.type)}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* 描述区域 */}
                  <div style={{ 
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      color: '#495057'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: taskDetail.description }} />
                    </div>
                  </div>

                  {/* 任务信息卡片 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#856404',
                        marginBottom: '4px'
                      }}>
                        奖励
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: '#d63031'
                      }}>
                        ¥{taskDetail.reward}
                      </div>
                    </div>
                    
                    <div style={{ 
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#d1ecf1',
                      border: '1px solid #bee5eb',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#0c5460',
                        marginBottom: '4px'
                      }}>
                        类型
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#0c5460'
                      }}>
                        {getTaskTypeName(taskDetail.type)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 底部状态栏 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 0',
                borderTop: '1px solid #e8e8e8',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Tag 
                    color={taskDetail.status === 'active' ? 'green' : 'red'}
                    style={{ 
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    {taskDetail.status === 'active' ? '进行中' : '已结束'}
                  </Tag>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#666'
                  }}>
                    {taskDetail.status === 'active' ? '任务正在进行中，可以接受' : '任务已结束'}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#999'
                }}>
                  {taskDetail.currentRecruits && taskDetail.maxRecruits && (
                    <span>
                      已接受 {taskDetail.currentRecruits}/{taskDetail.maxRecruits} 人
                    </span>
                  )}
                </div>
              </div>
              
              {/* 根据任务状态显示不同按钮 */}
              {(() => {
                // 如果是待接受任务，显示接受任务按钮
                if (taskDetail.status === 'active' && taskDetail.currentRecruits < taskDetail.maxRecruits) {
                  return (
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
                  );
                }
                
                // 如果是已接受任务且状态为pending，显示完成任务按钮
                if (currentTaskId && acceptedTaskDetail?.status === 'pending') {
                  return (
                    <div style={{ textAlign: 'center' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={handleCompleteTask}
                        style={{ marginTop: '12px' }}
                      >
                        完成任务
                      </Button>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          ) : !taskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              暂无任务详情
            </div>
          )}
        </Spin>
      </Modal>

      {/* 已接受任务详情弹窗 */}
      <Modal
        title="任务详情"
        open={acceptedTaskDetailModalVisible}
        onCancel={() => {
          setAcceptedTaskDetailModalVisible(false);
          setAcceptedTaskDetail(null);
        }}
        footer={[
          
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
        <Spin spinning={acceptedTaskDetailLoading}>
          {acceptedTaskDetail ? (
            <div>
              {/* 视频发布风格布局 */}
              <div style={{ 
                display: 'flex', 
                gap: '24px',
                marginBottom: '24px'
              }}>
                {/* 左侧：视频/媒体内容 */}
                <div style={{ flex: '0 0 400px' }}>
                  {acceptedTaskDetail.task?.materials && acceptedTaskDetail.task.materials.length > 0 && (
                    <div style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      backgroundColor: '#000'
                    }}>
                      {acceptedTaskDetail.task.materials[0].mediaList && acceptedTaskDetail.task.materials[0].mediaList.length > 0 && (
                        <div style={{ position: 'relative', cursor: 'pointer' }}>
                          {acceptedTaskDetail.task.materials[0].mediaList[0].type === 'video' ? (
                            <div 
                              style={{
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              onClick={() => handleVideoCoverClick(acceptedTaskDetail.task.materials[0].mediaList[0], acceptedTaskDetail.task.title)}
                            >
                              {/* 视频封面图片 */}
                              <img
                                src={acceptedTaskDetail.task.materials[0].coverUrl ? getOssUrl(acceptedTaskDetail.task.materials[0].coverUrl) : getOssUrl(acceptedTaskDetail.task.materials[0].mediaList[0].url)}
                                alt="video cover"
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block'
                                }}
                              />
                              {/* 播放按钮 */}
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontSize: '24px',
                                background: 'rgba(0,0,0,0.7)',
                                borderRadius: '50%',
                                width: '60px',
                                height: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}>
                                ▶
                              </div>
                            </div>
                          ) : (
                            <img
                              src={getOssUrl(acceptedTaskDetail.task.materials[0].mediaList[0].url)}
                              alt="media"
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                              }}
                              onClick={() => handleMediaClick(acceptedTaskDetail.task.materials[0].mediaList[0], acceptedTaskDetail.task.title)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 右侧：标题和描述 */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  {/* 标题区域 */}
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '20px', 
                      fontWeight: '600',
                      lineHeight: '1.4',
                      color: '#1a1a1a'
                    }}>
                      {acceptedTaskDetail.task?.title}
                    </h2>
                    
                    {/* 发布账号信息 */}
                    {acceptedTaskDetail.accountId && (() => {
                      const publishAccount = getAccountById(acceptedTaskDetail.accountId);
                      return publishAccount ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
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
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: '500',
                              color: '#1a1a1a'
                            }}>
                              {publishAccount.nickname}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666'
                            }}>
                              {getPlatformName(publishAccount.type)}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* 描述区域 */}
                  <div style={{ 
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      color: '#495057'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: acceptedTaskDetail.task?.description }} />
                    </div>
                  </div>

                  {/* 任务信息卡片 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#856404',
                        marginBottom: '4px'
                      }}>
                        奖励
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: '#d63031'
                      }}>
                        ¥{acceptedTaskDetail.reward}
                      </div>
                    </div>
                    
                    <div style={{ 
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#d1ecf1',
                      border: '1px solid #bee5eb',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#0c5460',
                        marginBottom: '4px'
                      }}>
                        类型
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#0c5460'
                      }}>
                        {getTaskTypeName(acceptedTaskDetail.task?.type)}
                      </div>
                    </div>
                  </div>

                  {/* 任务状态信息 */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#e2e3e5',
                      border: '1px solid #d6d8db',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#495057',
                        marginBottom: '4px'
                      }}>
                        接受时间
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '500',
                        color: '#495057'
                      }}>
                        {formatTime(acceptedTaskDetail.createdAt)}
                      </div>
                    </div>
                    
                    <div style={{ 
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#e2e3e5',
                      border: '1px solid #d6d8db',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#495057',
                        marginBottom: '4px'
                      }}>
                        提交时间
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '500',
                        color: '#495057'
                      }}>
                        {acceptedTaskDetail.submissionTime ? formatTime(acceptedTaskDetail.submissionTime) : '未提交'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 底部状态栏 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px 0',
                borderTop: '1px solid #e8e8e8',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Tag 
                    color={getTaskStatusTag(acceptedTaskDetail.status).color}
                    style={{ 
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    {getTaskStatusTag(acceptedTaskDetail.status).text}
                  </Tag>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#666'
                  }}>
                    {acceptedTaskDetail.status === 'pending' ? '任务待完成' : 
                     acceptedTaskDetail.status === 'doing' ? '任务已完成' : 
                     '任务状态：' + acceptedTaskDetail.status}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#999'
                }}>
                  {acceptedTaskDetail.isFirstTimeSubmission && (
                    <span style={{ color: '#52c41a' }}>首次提交</span>
                  )}
                </div>
              </div>
              
              {/* 根据任务状态显示不同按钮 */}
              {(() => {
                // 如果是已接受任务且状态为pending，显示完成任务按钮
                if (acceptedTaskDetail.status === 'pending') {
                  return (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={handleCompleteTask}
                        style={{ marginTop: '12px' }}
                      >
                        完成任务
                      </Button>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          ) : !acceptedTaskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              暂无任务详情
            </div>
          )}
        </Spin>
      </Modal>

      {/* 媒体预览弹窗 */}
      <Modal
        title={previewMedia?.title || '媒体预览'}
        open={mediaPreviewVisible}
        onCancel={handleCloseMediaPreview}
        afterClose={handleCloseMediaPreview}
        footer={[
          <Button key="close" onClick={handleCloseMediaPreview}>
            关闭
          </Button>
        ]}
        width={previewMedia?.type === 'video' ? 800 : 600}
        zIndex={3000}
        destroyOnClose={true}
        styles={{
          body: {
            padding: '24px',
            textAlign: 'center'
          }
        }}
      >
        {previewMedia && (
          <div>
            {previewMedia.type === 'video' ? (
              <video
                ref={setVideoRef}
                src={previewMedia.url}
                controls
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  borderRadius: '8px'
                }}
                autoPlay
                onEnded={() => {
                  // 视频播放结束时重置到开始
                  if (videoRef) {
                    videoRef.currentTime = 0;
                  }
                }}
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="preview"
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            )}
          </div>
        )}
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
            description: index === 0 ? (step.title.includes('完成任务') ? '正在调用完成任务接口...' : '正在调用接受任务接口...') : 
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
