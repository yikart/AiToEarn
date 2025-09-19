"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button, List, Modal, message, Spin, Empty, Popconfirm, Tooltip, Tag, Steps } from "antd";
import { CheckOutlined, DeleteOutlined, EyeOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  getNotificationList, 
  getNotificationDetail,
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotifications,
  getTaskDetail,
  acceptTask,
  submitTask,
  type NotificationItem,
  type TaskItem
} from "@/api/notification";
import { getAccountListApi } from "@/api/account";
import { SocialAccount } from "@/api/types/account.type";
import { apiCreatePublish } from "@/api/plat/publish";
import { getOssUrl } from "@/utils/oss";
import { PubType } from "@/app/config/publishConfig";
import { getAppDownloadConfig, getTasksRequiringApp } from "@/app/config/appDownloadConfig";
import DownloadAppModal from "@/components/common/DownloadAppModal";
import styles from "./NotificationPanel.module.scss";
import { useParams, useRouter } from "next/navigation";
import { getDays, getUtcDays } from "@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils";

// 导入平台图标
import douyinIcon from '@/assets/svgs/plat/douyin.svg';
import tiktokIcon from '@/assets/svgs/plat/tiktok.svg';
import youtubeIcon from '@/assets/svgs/plat/youtube.svg';
import bilibiliIcon from '@/assets/svgs/plat/bilibili.svg';
import xhsIcon from '@/assets/svgs/plat/xhs.svg';
import ksIcon from '@/assets/svgs/plat/ks.svg';
import wxSphIcon from '@/assets/svgs/plat/wx-sph.svg';
import wxGzhIcon from '@/assets/svgs/plat/wx-gzh.svg';
import facebookIcon from '@/assets/svgs/plat/facebook.svg';
import instagramIcon from '@/assets/svgs/plat/instagram.svg';
import threadsIcon from '@/assets/svgs/plat/xiancheng.svg';
import pinterestIcon from '@/assets/svgs/plat/pinterest.svg';
import twitterIcon from '@/assets/svgs/plat/twtter.svg';

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ visible, onClose }) => {
  const { t } = useTransClient("notification" as any);
  const token = useUserStore((state) => state.token);
  const router = useRouter();
  const { lng } = useParams();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPagination, setNotificationPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [accountList, setAccountList] = useState<SocialAccount[]>([]);
  
  // 下载App弹窗状态
  const [downloadAppVisible, setDownloadAppVisible] = useState(false);
  const [downloadAppConfig, setDownloadAppConfig] = useState({
    platform: "",
    appName: "",
    downloadUrl: "",
    qrCodeUrl: "" as string | undefined
  });

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

  // 账号选择弹窗状态
  const [accountSelectVisible, setAccountSelectVisible] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [requiredAccountTypes, setRequiredAccountTypes] = useState<string[]>([]);

  // 获取通知列表
  const fetchNotifications = async (page: number = 1, pageSize: number = 20) => {
    // 如果没有登录信息，不发送请求
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await getNotificationList({ page, pageSize });
      if (response && response.data) {
        setNotifications(response.data.list || []);
        setNotificationPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.total || 0
        }));
      }
    } catch (error) {
      message.error(t('getNotificationListFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 获取未读数量
  const fetchUnreadCount = async () => {
    // 如果没有登录信息，不发送请求
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await getUnreadCount();
      if (response && response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("获取未读数量失败:", error);
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

  // 标记单个通知为已读
  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead([id]);
      message.success(t('markSuccess'));
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      message.error(t('markFailed'));
    }
  };

  // 全部标记为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      message.success(t('markAllSuccess'));
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      message.error(t('markFailed'));
    }
  };

  // 查看通知详情
  const handleViewDetail = async (notification: NotificationItem) => {
    try {
      // 调用API获取通知详情
      const response:any = await getNotificationDetail(notification.id);
      if (response && response.data && response.code == 0) {
        setSelectedNotification(response.data);
        setDetailModalVisible(true);
        
        // 如果是任务提醒类型且有relatedId，获取任务详情
        if (notification.type === 'task_reminder' && notification.relatedId) {
          await fetchTaskDetail(notification.relatedId);
        }
        
        // 如果是未读状态，标记为已读
        if (notification.status === 'unread') {
          handleMarkAsRead(notification.id);
        }
      } else {
        message.error(t('getNotificationDetailFailed'));
      }
    } catch (error) {
      message.error(t('getNotificationDetailFailed'));
      console.error("获取通知详情失败:", error);
    }
  };

  // 获取任务详情
  const fetchTaskDetail = async (opportunityId: string) => {
    try {
      setTaskLoading(true);
      const response: any = await getTaskDetail(opportunityId);
      if (response && response.data && response.code === 0) {
        setSelectedTask(response.data);
      } else {
        console.error(t('getTaskDetailFailed'));
      }
    } catch (error) {
      console.error(t('getTaskDetailFailed'), error);
    } finally {
      setTaskLoading(false);
    }
  };

  // 接受任务
  const handleAcceptTask = async (account?: SocialAccount) => {
    if (!selectedTask) return;
    
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
      const response: any = await acceptTask(selectedTask.id, selectedTask.opportunityId, account?.id);
      if (response && response.code === 0) {
        // 更新进度：第一步完成，开始第二步
        setTaskProgress(prev => ({
          ...prev,
          currentStep: 1,
          steps: [
            { title: t('acceptingTask' as any), status: 'finish' },
            { title: t('publishingTask' as any), status: 'processing' },
            { title: t('taskCompleted' as any), status: 'wait' }
          ]
        }));

        // 第二步：发布任务
        // 优先使用传入的账号，其次使用任务指定的账号
        const publishAccount = account || getAccountById(selectedTask.accountId);
        if (publishAccount) {
          // 处理素材链接，确保使用完整链接
          const processedMaterials = selectedTask.materials?.map((material: any) => ({
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
            title: selectedTask.title,
            desc: selectedTask.description,
            type: selectedTask.type as any, // 转换为PubType
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
            publishTime: getUtcDays(getDays().add(6, "minute")).format(),
            userTaskId: response.data.id,
            taskMaterialId: selectedTask.materialIds[0]
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
            // 从发布响应中获取userTaskId，如果没有则使用任务ID
            const userTaskId = response.data.id;
            const submitResponse: any = await submitTask(userTaskId, selectedTask.materialIds[0]);
            
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

              // 延迟1秒后关闭进度窗口并跳转
              setTimeout(() => {
                setTaskProgressVisible(false);
                setDetailModalVisible(false);
                setSelectedTask(null);
                router.push(`/${lng}/tasks`);
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
      message.error(t('taskProcessFailed'));
      setTaskProgressVisible(false);
    }
  };

  // 检查任务类型并显示相应的操作提示
  const handleTaskAction = (task: TaskItem) => {
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
        handleAcceptTask(publishAccount);
        return;
      }
    }

    // 如果没有指定账号，需要用户选择账号
    const availableAccounts = getAvailableAccounts(task.accountTypes || []);
    
    if (availableAccounts.length === 0) {
      // 没有符合条件的账号，跳转到账户界面并弹出授权界面
      setRequiredAccountTypes(task.accountTypes || []);
      setDetailModalVisible(false); // 关闭任务详情弹窗
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
      handleAcceptTask(account);
      return;
    }
    
    // 多个符合条件的账号，显示选择弹窗
    setAvailableAccounts(availableAccounts);
    setAccountSelectVisible(true);
  };

  // 格式化时间
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

  // 获取通知类型文本
  const getNotificationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      system: t('notificationTypes.system' as any),
      user: t('notificationTypes.user' as any), 
      material: t('notificationTypes.material' as any),
      task_reminder: t('notificationTypes.task_reminder' as any),
      other: t('notificationTypes.other' as any)
    };
    return typeMap[type] || type;
  };

  // 获取通知类型颜色
  const getNotificationTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      system: "blue",
      user: "green", 
      material: "orange",
      task_reminder: "red",
      other: "default"
    };
    return colorMap[type] || "default";
  };

  // 删除通知
  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotifications([id]);
      message.success(t('deleteSuccess'));
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      message.error(t('deleteFailed'));
    }
  };

  // 获取平台显示名称
  const getPlatformName = (type: string) => {
    const { lng } = useParams();
    
    if (lng === 'en') {
      return type;
    }
    
    // 使用国际化显示名称
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

  // 获取平台图标
  const getPlatformIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'douyin': douyinIcon,
      'tiktok': tiktokIcon,
      'youtube': youtubeIcon,
      'bilibili': bilibiliIcon,
      'xhs': xhsIcon,
      'KWAI': ksIcon,
      'wxSph': wxSphIcon,
      'wxGzh': wxGzhIcon,
      'facebook': facebookIcon,
      'instagram': instagramIcon,
      'threads': threadsIcon,
      'pinterest': pinterestIcon,
      'twitter': twitterIcon,
    };
    return iconMap[type] || null;
  };

  // 根据accountId获取账号信息
  const getAccountById = (accountId: string): SocialAccount | null => {
    return accountList.find(account => account.id === accountId) || null;
  };

  // 获取符合条件的账号列表
  const getAvailableAccounts = (accountTypes: string[]): SocialAccount[] => {
    if (!accountTypes || accountTypes.length === 0) {
      return accountList; // 如果没有类型限制，返回所有账号
    }
    return accountList.filter(account => accountTypes.includes(account.type));
  };

  // 处理媒体点击
  const handleMediaClick = (media: any, materialTitle?: string, materialCoverUrl?: string) => {
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

  // 处理通知分页变化
  const handleNotificationPageChange = (page: number, pageSize?: number) => {
    fetchNotifications(page, pageSize || notificationPagination.pageSize);
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
    handleAcceptTask(account);
  };

  // 检查是否有新添加的符合条件账号
  const checkForNewAccounts = () => {
    if (requiredAccountTypes.length > 0 && selectedTask) {
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
          handleAcceptTask(account);
        } else {
          // 多个新账号，显示选择弹窗
          setAvailableAccounts(newAvailableAccounts);
          setAccountSelectVisible(true);
        }
      }
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      fetchUnreadCount();
      fetchAccountList();
    }
  }, [visible, token]);

  // 监听账号列表变化，检查是否有新添加的符合条件账号
  useEffect(() => {
    if (accountList.length > 0) {
      checkForNewAccounts();
    }
  }, [accountList, requiredAccountTypes, selectedTask]);


  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge count={unreadCount} size="small">
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{t('title')}</span>
            </Badge>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="markAll" onClick={handleMarkAllAsRead} disabled={unreadCount === 0} type="primary">
            {t('markAllAsRead')}
          </Button>,
          <Button key="close" onClick={onClose}>
            {t('cancel')}
          </Button>
        ]}
        width={700}
        destroyOnHidden
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px'
          },
          body: {
            padding: '6px'
          }
        }}
      >
        <Spin spinning={loading}>
          {notifications.length > 0 ? (
            <List
              dataSource={notifications}
              pagination={{
                current: notificationPagination.current,
                pageSize: notificationPagination.pageSize,
                total: notificationPagination.total,
                onChange: handleNotificationPageChange,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => t('pageInfo' as any, { start: range[0], end: range[1], total }),
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              renderItem={(item) => (
                <List.Item
                  className={`${styles.notificationItem} ${item.status === 'unread' ? styles.unread : ""}`}
                  actions={[
                    item.status === 'unread' && (
                      <Button
                        key="mark"
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                        }}
                      >
                        {t('markAsRead')}
                      </Button>
                    ),
                    <Popconfirm
                      key="delete"
                      title={t('confirmDelete')}
                      onConfirm={() => handleDeleteNotification(item.id)}
                      okText={t('confirm')}
                      cancelText={t('cancel')}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('delete')}
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <div 
                    className={styles.notificationClickableArea}
                    onClick={() => handleViewDetail(item)}
                    style={{ 
                      cursor: 'pointer',
                      width: '100%',
                      padding: '8px 0'
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <div className={styles.notificationTitle}>
                          <span>{item.title}</span>
                          {item.status === 'unread' && <Badge status="processing" />}
                        </div>
                      }
                      description={
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationMeta}>
                            <Tag color={getNotificationTypeColor(item.type)}>
                              {getNotificationTypeText(item.type)}
                            </Tag>
                            <span className={styles.time}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {formatTime(item.createdAt)}
                            </span>
                          </div>
                          <div className={styles.content}>
                            {item.content.length > 100 
                              ? `${item.content.substring(0, 100)}...` 
                              : item.content
                            }
                          </div>
                        </div>
                      }
                    />
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description={t('noNotifications')} />
          )}
        </Spin>
      </Modal>

      {/* 通知详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>{t('detailTitle')}</span>
          </div>
        }
        zIndex={2000}
                 open={detailModalVisible}
         onCancel={() => {
           setDetailModalVisible(false);
           setSelectedTask(null);
         }}
                 footer={[
           <Button key="close" onClick={() => {
             setDetailModalVisible(false);
             setSelectedTask(null);
           }} type="primary">
             {t('close')}
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
                 {selectedNotification && (
           <div className={styles.notificationDetail}>
             <h3>{selectedNotification.title}</h3>
             <div className={styles.meta}>
               <span>
                 <Tag color={getNotificationTypeColor(selectedNotification.type)}>
                   {getNotificationTypeText(selectedNotification.type)}
                 </Tag>
               </span>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 <span>
                   <ClockCircleOutlined style={{ marginRight: 4 }} />
                   {t('createTime')}: {formatTime(selectedNotification.createdAt)}
                 </span>
                 {selectedNotification.readAt && (
                   <span style={{ color: '#52c41a' }}>
                     {t('readTime')}: {formatTime(selectedNotification.readAt)}
                   </span>
                 )}
               </div>
             </div>
             {/* <div className={styles.content}>
               {selectedNotification.content}
             </div> */}
             
             {/* 任务详情部分 */}
             {selectedNotification.type === 'task_reminder' && (
               <div className={styles.taskDetail}>
                 <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>{t('taskDetail')}</h4>
                 <Spin spinning={taskLoading}>
                   {selectedTask ? (
                     <div className={styles.taskInfo}>
                       <div className={styles.taskHeader}>
                         <h5>{selectedTask.title}</h5>
                         <Tag color={selectedTask.status === 'active' ? 'green' : 'red'}>
                           {selectedTask.status === 'active' ? t('taskStatus.active' as any) : t('taskStatus.inactive' as any)}
                         </Tag>
                       </div>
                       <div className={styles.taskContent}>
                         <p><strong>{t('taskInfo.description' as any)}：</strong>
                           <div dangerouslySetInnerHTML={{ __html: selectedTask.description }} />
                         </p>
                         {/* 发布账号信息 */}
                         {selectedTask.accountId && (() => {
                           const publishAccount = getAccountById(selectedTask.accountId);
                           return publishAccount ? (
                             <p><strong>{t('taskInfo.publisherAccount' as any)}：</strong>
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
                             <p><strong>{t('taskInfo.publisherAccount' as any)}：</strong>
                               <Tag color="red" style={{ marginLeft: '4px' }}>
                                 {t('accountInfoFailed')}
                               </Tag>
                             </p>
                           );
                         })()}

                            {/* 任务平台类型显示 */}
                            {selectedTask.accountTypes && selectedTask.accountTypes.length > 0 && (
                           <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: '6px' }}>
                             <strong>{t('taskInfo.platformTypes' as any)}：</strong>
                             {selectedTask.accountTypes.map(type => {
                               const platformIcon = getPlatformIcon(type);
                               return platformIcon ? (
                                 <img
                                   key={type}
                                   src={platformIcon}
                                   alt={`${type} icon`}
                                   style={{
                                     width: '20px',
                                     height: '20px',
                                     objectFit: 'contain'
                                   }}
                                 />
                               ) : null;
                             })}
                           </p>
                         )}

                         <p><strong>{t('taskInfo.reward' as any)}：</strong>¥{selectedTask.reward/100}</p>
                         {/* <p><strong>招募人数：</strong>{selectedTask.currentRecruits}/{selectedTask.maxRecruits}</p> */}

                                                   <p><strong>{t('taskInfo.taskType' as any)}：</strong>
                            <Tag color="blue" style={{ marginLeft: '4px' }}>
                              {getTaskTypeName(selectedTask.type)}
                            </Tag>
                          </p>
                         
                      
                         
                         {/* 任务素材展示 */}
                         {selectedTask.materials && selectedTask.materials.length > 0 && (
                           <div style={{ marginTop: '16px' }}>
                             <p><strong>{t('taskInfo.taskType' as any)}：</strong></p>
                             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                               {selectedTask.materials.map((material: any, index: number) => (
                                 <div key={index} style={{ 
                                   border: '1px solid #e8e8e8', 
                                   borderRadius: '8px', 
                                   padding: '8px',
                                   maxWidth: '200px'
                                 }}>
                                   {/* <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                     {material.title}
                                   </div> */}
                                   { (material.coverUrl && material.type !== "video") && (
                                     <img
                                       src={getOssUrl(material.coverUrl)}
                                       alt="cover"
                                       style={{
                                         width: '100%',
                                         height: '100px',
                                         objectFit: 'cover',
                                         borderRadius: '4px',
                                         marginBottom: '4px'
                                       }}
                                     />
                                   )}
                                   {/* <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                                     {material.desc?.substring(0, 50)}{material.desc?.length > 50 ? '...' : ''}
                                   </div> */}
                                   {material.mediaList && material.mediaList.length > 0 && (
                                     <div style={{ 
                                       display: 'flex', 
                                       gap: '4px', 
                                       marginTop: '4px',
                                       flexWrap: 'wrap'
                                     }}>
                                       {material.mediaList.slice(0, 3).map((media: any, mediaIndex: number) => (
                                         <div key={mediaIndex} style={{ position: 'relative', cursor: 'pointer' }}>
                                           {media.type === 'video' ? (
                                             <div 
                                               style={{
                                                 width: '180px',
                                                 height: '180px',
                                                 borderRadius: '2px',
                                                 position: 'relative',
                                                 overflow: 'hidden'
                                               }}
                                               onClick={() => handleVideoCoverClick(media, material.title)}
                                             >
                                               {/* 视频封面图片 - 使用material.coverUrl */}
                                               <img
                                                 src={material.coverUrl ? getOssUrl(material.coverUrl) : getOssUrl(media.url)}
                                                 alt="video cover"
                                                 style={{
                                                   width: '100%',
                                                   height: '100%',
                                                   objectFit: 'cover'
                                                 }}
                                               />
                                               {/* 播放按钮 */}
                                               <div style={{
                                                 position: 'absolute',
                                                 top: '50%',
                                                 left: '50%',
                                                 transform: 'translate(-50%, -50%)',
                                                 color: 'white',
                                                 fontSize: '11px',
                                                 background: 'rgba(0,0,0,0.6)',
                                                 borderRadius: '50%',
                                                 width: '26px',
                                                 height: '26px',
                                                 display: 'flex',
                                                 alignItems: 'center',
                                                 justifyContent: 'center'
                                               }}>
                                                 ▶
                                               </div>
                                             </div>
                                           ) : (
                                             <img
                                               src={getOssUrl(media.url)}
                                               alt="media"
                                               style={{
                                                 width: '40px',
                                                 height: '40px',
                                                 objectFit: 'cover',
                                                 borderRadius: '2px'
                                               }}
                                               onClick={() => handleMediaClick(media, material.title)}
                                             />
                                           )}
                                         </div>
                                       ))}
                                       {material.mediaList.length > 3 && (
                                         <div style={{
                                           width: '40px',
                                           height: '40px',
                                           background: '#f0f0f0',
                                           borderRadius: '2px',
                                           display: 'flex',
                                           alignItems: 'center',
                                           justifyContent: 'center',
                                           fontSize: '10px',
                                           color: '#666'
                                         }}>
                                           +{material.mediaList.length - 3}
                                         </div>
                                       )}
                                     </div>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                       {selectedTask.status === 'active' && selectedTask.currentRecruits < selectedTask.maxRecruits && (
                         <div className={styles.taskActions}>
                           {/* 需要App操作的平台提示 - 只根据发布账号类型判断 */}
                           {(() => {
                             // 只根据发布账号类型判断是否需要App操作
                             if (selectedTask.accountId) {
                               const publishAccount = getAccountById(selectedTask.accountId);
                               if (publishAccount) {
                                 const appRequiredPlatforms = getTasksRequiringApp([publishAccount.type]);
                                 if (appRequiredPlatforms.length > 0) {
                                   const platformNames = appRequiredPlatforms.map(p => getAppDownloadConfig(p)?.platform).filter(Boolean);
                                   return (
                                     <div style={{ 
                                       marginBottom: '12px',
                                       padding: '12px',
                                       backgroundColor: '#fff7e6',
                                       border: '1px solid #ffd591',
                                       borderRadius: '6px',
                                       color: '#d46b08'
                                     }}>
                                       <strong>{t('appRequiredNotice')}</strong>
                                       {t('appRequiredMessage' as any, { platform: getPlatformName(publishAccount.type) })}
                                     </div>
                                   );
                                 }
                               }
                             }
                             return null;
                           })()}
                           
                           <Button 
                             type="primary" 
                             onClick={() => handleTaskAction(selectedTask)}
                             style={{ marginTop: '12px' }}
                           >
                             {t('acceptTask')}
                           </Button>
                         </div>
                       )}
                     </div>
                   ) : !taskLoading && (
                     <div style={{ textAlign: 'center', color: '#999' }}>
                       {t('noTaskDetails')}
                     </div>
                   )}
                 </Spin>
               </div>
             )}
           </div>
         )}
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

      {/* 媒体预览弹窗 */}
      <Modal
        title={previewMedia?.title || t('mediaPreview')}
        open={mediaPreviewVisible}
        onCancel={handleCloseMediaPreview}
        afterClose={handleCloseMediaPreview}
        footer={[
          <Button key="close" onClick={handleCloseMediaPreview}>
            {t('close')}
          </Button>
        ]}
        width={previewMedia?.type === 'video' ? 800 : 600}
        zIndex={3000}
        destroyOnHidden={true}
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
            description: index === 0 ? t('acceptingTask' as any) : 
                        index === 1 ? t('publishingTask' as any) : 
                        index === 2 ? t('submittingTask' as any) :
                        t('taskCompleted' as any)
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
                cursor: 'pointer',
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '8px',
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleAccountSelect(account)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.backgroundColor = '#f6ffed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
                    <span style={{ fontWeight: '600' }}>{account.nickname}</span>
                    <Tag color="blue">{getPlatformName(account.type)}</Tag>
                  </div>
                }
                description={
                  <div style={{ color: '#666' }}>
                    <div>{t('accountSelect.accountId' as any)}: {account.account}</div>
                    {account.nickname && <div>{t('accountSelect.description' as any)}: {account.nickname}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

export default NotificationPanel;