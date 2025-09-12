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
import { useRouter, useParams } from "next/navigation";
import styles from "./taskPageCore.module.scss";

const { TabPane } = Tabs;

export default function TaskPageCore() {
  const { t } = useTransClient("task" as any);
  const token = useUserStore((state) => state.token);
  const router = useRouter();
  const params = useParams();
  const lng = params.lng as string;
  
  // 如果未登录，显示登录提示
  if (!token) {
    return (
      <div className={styles.taskPage}>
        <div className={styles.header}>
          <h1>{t('title')}</h1>
          <p>{t('messages.pleaseLoginFirst')}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description={t('messages.pleaseLoginFirst')} />
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
      { title: t('acceptingTask' as any), status: 'processing' },
      { title: t('publishingTask' as any), status: 'wait' },
      { title: t('submittingTask' as any), status: 'wait' },
      { title: t('taskCompleted' as any), status: 'wait' }
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

  // 账号选择弹窗状态
  const [accountSelectVisible, setAccountSelectVisible] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [requiredAccountTypes, setRequiredAccountTypes] = useState<string[]>([]);

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
      message.error(t('messages.getPendingTasksFailed'));
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
      message.error(t('messages.getAcceptedTasksFailed'));
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
        message.success(t('messages.acceptTaskSuccess'));
        // 刷新任务列表
        fetchPendingTasks();
        fetchAcceptedTasks();
        // 切换到已接受任务标签
        setActiveTab("accepted");
      } else {
        message.error(t('messages.acceptTaskFailed'));
      }
    } catch (error) {
      message.error(t('messages.acceptTaskFailed'));
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
      message.error(t('modal.submitLink') + ' ' + t('messages.pleaseLoginFirst'));
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
          message.success(t('messages.submitTaskSuccess'));
          setSubmitModalVisible(false);
          fetchAcceptedTasks();
        } else {
          message.error(t('messages.submitTaskFailed'));
        }
      } else {
        message.error(t('messages.publishTaskFailed'));
      }
    } catch (error) {
      message.error(t('messages.submitTaskFailed'));
      console.error("任务提交失败:", error);
    } finally {
      setSubmittingTaskId(null);
    }
  };

  // 获取平台显示名称
  const getPlatformName = (type: string) => {
    const platformNames: Record<string, string> = {
      'tiktok': t('platforms.tiktok' as any),
      'youtube': t('platforms.youtube' as any), 
      'twitter': t('platforms.twitter' as any),
      'bilibili': t('platforms.bilibili' as any),
      'KWAI': t('platforms.KWAI' as any),
      'douyin': t('platforms.douyin' as any),
      'xhs': t('platforms.xhs' as any),
      'wxSph': t('platforms.wxSph' as any),
      'wxGzh': t('platforms.wxGzh' as any),
      'facebook': t('platforms.facebook' as any),
      'instagram': t('platforms.instagram' as any),
      'threads': t('platforms.threads' as any),
      'pinterest': t('platforms.pinterest' as any),
    };
    return platformNames[type] || type;
  };

  // 获取任务类型显示名称
  const getTaskTypeName = (type: string) => {
    const taskTypeNames: Record<string, string> = {
      'video': t('taskTypes.video' as any),
      'article': t('taskTypes.article' as any),
      'article2': t('taskTypes.article2' as any),
    };
    return taskTypeNames[type] || type;
  };

  // 格式化时间（相对时间，如"3小时前"）
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t('time.justNow' as any);
    if (minutes < 60) return t('time.minutesAgo' as any, { minutes });
    if (hours < 24) return t('time.hoursAgo' as any, { hours });
    if (days < 7) return t('time.daysAgo' as any, { days });
    return date.toLocaleDateString();
  };

  // 格式化绝对时间（显示具体日期时间）
  const formatAbsoluteTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    // 如果是未来时间，显示剩余时间
    if (diff > 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 60) return `${minutes}分钟后`;
      if (hours < 24) return `${hours}小时后`;
      if (days < 7) return `${days}天后`;
    }
    
    // 显示具体日期时间
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取任务状态标签
  const getTaskStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'pending': { color: 'green', text: '已完成' }, // pending 是已完成
      'doing': { color: 'orange', text: '待完成' }, // doing 是待完成
      'accepted': { color: 'blue', text: t('taskStatus.accepted' as any) },
      'completed': { color: 'green', text: t('taskStatus.completed' as any) },
      'rejected': { color: 'red', text: t('taskStatus.rejected' as any) },
    };
    return statusMap[status] || { color: 'default', text: status };
  };

  // 根据accountId获取账号信息
  const getAccountById = (accountId: string): SocialAccount | null => {
    return accountList.find(account => account.id === accountId) || null;
  };

  // 获取符合条件的账号
  const getAvailableAccounts = (accountTypes: string[]): SocialAccount[] => {
    if (!accountTypes || accountTypes.length === 0) {
      return accountList;
    }
    return accountList.filter(account => accountTypes.includes(account.type));
  };

  // 处理任务操作（接受任务）
  const handleTaskAction = (task: any) => {
    // 首先检查任务支持的所有平台是否都需要App操作
    const taskPlatforms = task.accountTypes || [];
    const appRequiredPlatforms = getTasksRequiringApp(taskPlatforms);
    
    // 如果所有平台都需要App操作，直接显示下载App提示
    if (appRequiredPlatforms.length > 0 && appRequiredPlatforms.length === taskPlatforms.length) {
      const firstPlatform = appRequiredPlatforms[0];
      const config = getAppDownloadConfig(firstPlatform);
      
      if (config) {
        setDownloadAppConfig({
          platform: config.platform,
          appName: config.appName,
          downloadUrl: config.downloadUrl,
          qrCodeUrl: config.qrCodeUrl
        });
        setDownloadAppVisible(true);
        return;
      }
    }

    // 如果任务指定了账号，使用指定账号的逻辑
    if (task.accountId) {
      const publishAccount = getAccountById(task.accountId);
      if (publishAccount) {
        // 检查发布账号的平台是否需要App操作
        const appRequiredPlatforms = getTasksRequiringApp([publishAccount.type]);
        
        if (appRequiredPlatforms.length > 0) {
          // 有需要App操作的平台，显示第一个平台的下载提示
          const firstPlatform = appRequiredPlatforms[0];
          const config = getAppDownloadConfig(firstPlatform);
          
          if (config) {
            setDownloadAppConfig({
              platform: config.platform,
              appName: config.appName,
              downloadUrl: config.downloadUrl,
              qrCodeUrl: config.qrCodeUrl
            });
            setDownloadAppVisible(true);
            return;
          }
        }
        
        // 直接使用指定账号接受任务
        handleAcceptTaskFromDetail(task, publishAccount);
        return;
      }
    }

    // 如果没有指定账号，需要用户选择账号
    const availableAccounts = getAvailableAccounts(task.accountTypes || []);
    
    if (availableAccounts.length === 0) {
      // 没有符合条件的账号，跳转到账户界面并弹出授权界面
      setRequiredAccountTypes(task.accountTypes || []);
      setTaskDetailModalVisible(false); // 关闭任务详情弹窗
      // 关闭消息通知弹窗  
      message.info(t('accountSelect.redirectingToAccounts' as any));
      
      // 构建跳转URL，包含需要的平台类型参数
      const accountTypes = task.accountTypes || [];
      const platformParam = accountTypes.length > 0 ? accountTypes[0] : undefined;
      const accountsUrl = platformParam 
        ? `/${lng}/accounts?platform=${platformParam}`
        : `/${lng}/accounts`;
      
      router.push(accountsUrl); // 跳转到账户界面并自动打开添加账号弹窗
      return;
    }

    if (availableAccounts.length === 1) {
      // 只有一个符合条件的账号，直接使用
      const account = availableAccounts[0];
      
      // 检查是否需要App操作
      const appRequiredPlatforms = getTasksRequiringApp([account.type]);
      if (appRequiredPlatforms.length > 0) {
        const firstPlatform = appRequiredPlatforms[0];
        const config = getAppDownloadConfig(firstPlatform);
        
        if (config) {
          setDownloadAppConfig({
            platform: config.platform,
            appName: config.appName,
            downloadUrl: config.downloadUrl,
            qrCodeUrl: config.qrCodeUrl
          });
          setDownloadAppVisible(true);
          return;
        }
      }
      
      // 直接使用这个账号接受任务
      handleAcceptTaskFromDetail(task, account);
      return;
    }
    
    // 多个符合条件的账号，显示选择弹窗
    setAvailableAccounts(availableAccounts);
    setAccountSelectVisible(true);
  };

  // 处理账号选择
  const handleAccountSelect = (account: SocialAccount) => {
    setSelectedAccount(account);
    setAccountSelectVisible(false);
    
    // 检查是否需要App操作
    const appRequiredPlatforms = getTasksRequiringApp([account.type]);
    if (appRequiredPlatforms.length > 0) {
      const firstPlatform = appRequiredPlatforms[0];
      const config = getAppDownloadConfig(firstPlatform);
      
      if (config) {
        setDownloadAppConfig({
          platform: config.platform,
          appName: config.appName,
          downloadUrl: config.downloadUrl,
          qrCodeUrl: config.qrCodeUrl
        });
        setDownloadAppVisible(true);
        return;
      }
    }
    
    // 使用选择的账号接受任务
    if (taskDetail) {
      handleAcceptTaskFromDetail(taskDetail, account);
    }
  };

  // 检查是否有新添加的符合条件账号
  const checkForNewAccounts = () => {
    if (requiredAccountTypes.length > 0 && taskDetail) {
      const newAvailableAccounts = getAvailableAccounts(requiredAccountTypes);
      
      if (newAvailableAccounts.length > 0) {
        // 有新账号了，清除需求状态
        setRequiredAccountTypes([]);
        
        if (newAvailableAccounts.length === 1) {
          // 只有一个新账号，直接使用
          const account = newAvailableAccounts[0];
          
          // 检查是否需要App操作
          const appRequiredPlatforms = getTasksRequiringApp([account.type]);
          if (appRequiredPlatforms.length > 0) {
            const firstPlatform = appRequiredPlatforms[0];
            const config = getAppDownloadConfig(firstPlatform);
            
            if (config) {
              setDownloadAppConfig({
                platform: config.platform,
                appName: config.appName,
                downloadUrl: config.downloadUrl,
                qrCodeUrl: config.qrCodeUrl
              });
              setDownloadAppVisible(true);
              return;
            }
          }
          
          // 直接使用这个账号接受任务
          handleAcceptTaskFromDetail(taskDetail, account);
        } else {
          // 多个新账号，显示选择弹窗
          setAvailableAccounts(newAvailableAccounts);
          setAccountSelectVisible(true);
        }
      }
    }
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
        message.error(t('messages.getTaskDetailFailed'));
      }
    } catch (error) {
      message.error(t('messages.getTaskDetailFailed'));
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
        message.error(t('messages.getTaskDetailFailed'));
      }
    } catch (error) {
      message.error(t('messages.getTaskDetailFailed'));
      console.error("获取任务详情失败:", error);
    } finally {
      setAcceptedTaskDetailLoading(false);
    }
  };

  // 从任务详情接受任务
  const handleAcceptTaskFromDetail = async (task: any, account?: SocialAccount) => {
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
      const response: any = await acceptTask(task.id, task.opportunityId, account?.id);
      if (response && response.code === 0) {
        // 更新进度：第一步完成，开始第二步
        setTaskProgress(prev => ({
          ...prev,
          currentStep: 1,
          steps: [
            { title: t('acceptingTask' as any), status: 'finish' },
            { title: t('publishingTask' as any), status: 'processing' },
            { title: t('submittingTask' as any), status: 'wait' },
            { title: t('taskCompleted' as any), status: 'wait' }
          ]
        }));

        // 第二步：发布任务
        const publishAccount = account || getAccountById(task.accountId);
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
                { title: t('acceptingTask' as any), status: 'finish' },
                { title: t('publishingTask' as any), status: 'finish' },
                { title: t('submittingTask' as any), status: 'processing' },
                { title: t('taskCompleted' as any), status: 'wait' }
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
                  { title: t('acceptingTask' as any), status: 'finish' },
                  { title: t('publishingTask' as any), status: 'finish' },
                  { title: t('submittingTask' as any), status: 'finish' },
                  { title: t('taskCompleted' as any), status: 'finish' }
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
        { title: t('completeTask' as any), status: 'processing' },
        { title: t('publishingTask' as any), status: 'wait' },
        { title: t('submittingTask' as any), status: 'wait' },
        { title: t('taskCompleted' as any), status: 'wait' }
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

  // 监听账号列表变化，检查是否有新添加的符合条件账号
  useEffect(() => {
    if (accountList.length > 0) {
      checkForNewAccounts();
    }
  }, [accountList, requiredAccountTypes, taskDetail]);

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
              &nbsp; {t('pendingTasks')}
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
                          {/* 显示多个平台图标 */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {(task.accountTypes && task.accountTypes.length > 0 ? task.accountTypes : [task.accountType]).map((platformType: string, index: number) => (
                              <img 
                                key={platformType}
                                src={getPlatformIcon(platformType)} 
                                alt="platform"
                                style={{ width: '20px', height: '20px' }}
                              />
                            ))}
                          </div>
                          <h3 style={{ margin: 0, fontSize: '16px' }}>
                            {task.accountTypes && task.accountTypes.length > 0 
                              ? `${task.accountTypes.map((type: string) => getPlatformName(type)).join('、')}任务`
                              : `${getPlatformName(task.accountType)}任务`
                            }
                          </h3>
                        </div>
                        <Tag color="orange">{t('taskStatus.pending' as any)}</Tag>
                      </div>
                      
                      <div className={styles.taskContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span><strong>{t('taskInfo.publishTime' as any)}：</strong>{formatTime(task.createdAt)}</span>
                          <span><strong>{t('taskInfo.endTime' as any)}：</strong>{formatAbsoluteTime(task.expiredAt)}</span>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <strong>{t('taskInfo.reward' as any)}：</strong>
                          <span style={{ color: '#f50', fontWeight: 'bold' }}>¥ {task.reward/100}</span>
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
                          {t('viewDetails')}
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
                    showTotal={(total, range) => t('messages.pageInfo' as any, { start: range[0], end: range[1], total })}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </div>
            ) : (
              <Empty description={t('messages.noPendingTasks')} />
            )}
          </Spin>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <PlayCircleOutlined />
              &nbsp; {t('acceptedTasks')}
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
                          {/* 显示多个平台图标 */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {(task.accountTypes && task.accountTypes.length > 0 ? task.accountTypes : [task.accountType]).map((platformType: string, index: number) => (
                              <img 
                                key={platformType}
                                src={getPlatformIcon(platformType)} 
                                alt="platform"
                                style={{ width: '20px', height: '20px' }}
                              />
                            ))}
                          </div>
                          <h3 style={{ margin: 0, fontSize: '16px' }}>
                            {task.accountTypes && task.accountTypes.length > 0 
                              ? `${task.accountTypes.map((type: string) => getPlatformName(type)).join('、')}任务`
                              : `${getPlatformName(task.accountType)}任务`
                            }
                          </h3>
                        </div>
                        <Tag color={getTaskStatusTag(task.status).color}>
                          {getTaskStatusTag(task.status).text}
                        </Tag>
                      </div>
                      
                      <div className={styles.taskContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span><strong>{t('taskInfo.acceptTime' as any)}：</strong>{formatTime(task.createdAt)}</span>
                          <span> </span>
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <strong>{t('taskInfo.reward' as any)}：</strong>
                          <span style={{ color: '#f50', fontWeight: 'bold' }}>¥ {task.reward/100}</span>
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
                          {t('viewDetails')}
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
                    showTotal={(total, range) => t('messages.pageInfo' as any, { start: range[0], end: range[1], total })}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </div>
            ) : (
              <Empty description={t('messages.noAcceptedTasks')} />
            )}
          </Spin>
        </TabPane>
      </Tabs>

      {/* 提交任务弹窗 */}
      <Modal
        title={t('modal.submitTask')}
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        onOk={confirmSubmitTask}
        confirmLoading={submittingTaskId !== null}
        okText={t('modal.confirmSubmit')}
        cancelText={t('modal.cancel')}
      >
        <div style={{ marginBottom: '16px' }}>
          <label>{t('modal.submitLink')}：</label>
          <Input
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            placeholder={t('modal.submitLinkPlaceholder')}
            style={{ marginTop: '8px' }}
          />
        </div>
        <p style={{ color: '#666', fontSize: '12px' }}>
          {t('modal.submitTip')}
        </p>
      </Modal>

      {/* 任务详情弹窗 */}
      <Modal
        title={t('taskDetails')}
        open={taskDetailModalVisible}
        onCancel={() => {
          setTaskDetailModalVisible(false);
          setTaskDetail(null);
        }}
        footer={[
          
        ]}
        width={800}
        zIndex={2000}
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
                        {t('taskInfo.reward' as any)}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: '#d63031'
                      }}>
                        ¥ {taskDetail.reward/100}
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
                        {t('taskInfo.type' as any)}
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

                  {/* 支持的平台类型 */}
                  {taskDetail.accountTypes && taskDetail.accountTypes.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>支持平台：</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {taskDetail.accountTypes.map((platformType: string) => (
                            <img 
                              key={platformType}
                              src={getPlatformIcon(platformType)} 
                              alt={platformType}
                              style={{ width: '25px', height: '25px' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
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
                    {taskDetail.status === 'active' ? t('taskStatus.active' as any) : t('taskStatus.inactive' as any)}
                  </Tag>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#666'
                  }}>
                    {taskDetail.status === 'active' ? t('messages.taskInProgress' as any) : t('messages.taskEnded' as any)}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '12px', 
                  color: '#999'
                }}>
                  {taskDetail.currentRecruits && taskDetail.maxRecruits && (
                    <span>
                      {t('messages.acceptedCount' as any, { current: taskDetail.currentRecruits, max: taskDetail.maxRecruits })}
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
                        onClick={() => handleTaskAction(taskDetail)}
                        style={{ marginTop: '12px' }}
                      >
                        {t('acceptTask')}
                      </Button>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          ) : !taskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              {t('messages.noTaskDetails')}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 已接受任务详情弹窗 */}
      <Modal
        title={t('taskDetails')}
        open={acceptedTaskDetailModalVisible}
        onCancel={() => {
          setAcceptedTaskDetailModalVisible(false);
          setAcceptedTaskDetail(null);
        }}
        footer={[
          
        ]}
        width={800}
        zIndex={2000}
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
                        {t('taskInfo.reward' as any)}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: '#d63031'
                      }}>
                        ¥ {acceptedTaskDetail.reward/100}
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
                        {t('taskInfo.type' as any)}
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
                    {acceptedTaskDetail.status === 'doing' ? '任务待完成' : 
                     acceptedTaskDetail.status === 'pending' ? '任务已完成' : 
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
                // 如果是已接受任务且状态为doing（待完成），显示完成任务按钮
                if (acceptedTaskDetail.status === 'doing') {
                  return (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        onClick={handleCompleteTask}
                        style={{ marginTop: '12px' }}
                      >
                        {t('completeTask')}
                      </Button>
                    </div>
                  );
                }
                
                return null;
              })()}
            </div>
          ) : !acceptedTaskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              {t('messages.noTaskDetails')}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 媒体预览弹窗 */}
      <Modal
        title={previewMedia?.title || t('modal.mediaPreview')}
        open={mediaPreviewVisible}
        onCancel={handleCloseMediaPreview}
        afterClose={handleCloseMediaPreview}
        footer={[
          <Button key="close" onClick={handleCloseMediaPreview}>
            {t('modal.close')}
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
        title={t('taskProcessing')}
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
            description: index === 0 ? (step.title.includes(t('completeTask' as any)) ? t('messages.taskProcessFailed') : t('messages.taskProcessFailed')) : 
                        index === 1 ? t('messages.taskProcessFailed') : 
                        index === 2 ? t('messages.taskProcessFailed') :
                        t('messages.taskProcessFailed')
          }))}
        />
      </Modal>

      {/* 账号选择弹窗 */}
      <Modal
        title={t('accountSelect.title' as any)}
        open={accountSelectVisible}
        onCancel={() => setAccountSelectVisible(false)}
        footer={null}
        width={600}
        zIndex={2500}
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
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#666' }}>
            {t('accountSelect.description' as any)}
          </p>
        </div>
        <List
          dataSource={availableAccounts}
          renderItem={(account) => (
            <List.Item
              style={{
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.backgroundColor = '#f6ffed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => handleAccountSelect(account)}
            >
              <List.Item.Meta
                avatar={
                  <img
                    src={account.avatar ? getOssUrl(account.avatar) : '/default-avatar.png'}
                    alt="账号头像"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{account.nickname}</span>
                    <Tag color="blue">{getPlatformName(account.type)}</Tag>
                  </div>
                }
                description={
                  <div style={{ color: '#666' }}>
                    <div>{t('accountSelect.accountId' as any)}: {account.account}</div>
                    {account.nickname && <div>昵称: {account.nickname}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
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
        zIndex={3000}
      />
    </div>
  );
}
