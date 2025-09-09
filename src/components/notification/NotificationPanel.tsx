"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button, List, Modal, message, Spin, Empty, Popconfirm, Tooltip, Tag } from "antd";
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

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ visible, onClose }) => {
  const { t } = useTransClient("common");
  const token = useUserStore((state) => state.token);
  const router = useRouter();
  const { lng } = useParams();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // 任务进度弹窗状态
  const [taskProgressVisible, setTaskProgressVisible] = useState(false);
  const [taskProgress, setTaskProgress] = useState({
    currentStep: 0,
    steps: [
      { title: '正在接受任务...', status: 'processing' },
      { title: '正在发布任务...', status: 'wait' },
      { title: '发布完成', status: 'wait' }
    ]
  });

  // 获取通知列表
  const fetchNotifications = async () => {
    // 如果没有登录信息，不发送请求
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await getNotificationList({ page: 1, pageSize: 20 });
      if (response && response.data) {
        setNotifications(response.data.list || []);
      }
    } catch (error) {
      message.error("获取通知列表失败");
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
      message.success("标记成功");
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      message.error("标记失败");
    }
  };

  // 全部标记为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      message.success("全部标记成功");
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      message.error("标记失败");
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
        message.error("获取通知详情失败");
      }
    } catch (error) {
      message.error("获取通知详情失败");
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
        console.error("获取任务详情失败");
      }
    } catch (error) {
      console.error("获取任务详情失败:", error);
    } finally {
      setTaskLoading(false);
    }
  };

  // 接受任务
  const handleAcceptTask = async () => {
    if (!selectedTask) return;
    
    try {
      const response: any = await acceptTask(selectedTask.id, selectedTask.opportunityId);
      if (response && response.code === 0) {
        message.success("接任务成功！");
        // 关闭详情弹窗
        setDetailModalVisible(false);
        setSelectedTask(null);
        // 跳转到任务页面
        router.push(`/${lng}/tasks`);
      } else {
        message.error("接任务失败");
      }
    } catch (error) {
      message.error("接任务失败");
      console.error("接任务失败:", error);
    }
  };

  // 检查任务类型并显示相应的操作提示
  const handleTaskAction = (task: TaskItem) => {
    // 根据发布账号类型判断PC是否能接任务
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
      }
    }

    // 如果没有发布账号信息，回退到原来的逻辑
    if (!task.accountTypes || task.accountTypes.length === 0) {
      // 没有账号类型限制，直接接取任务
      handleAcceptTask();
      return;
    }

    // 检查需要App操作的平台
    const appRequiredPlatforms = getTasksRequiringApp(task.accountTypes);
    
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
    
    // 其他任务类型正常接取
    handleAcceptTask();
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

  // 获取通知类型文本
  const getNotificationTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      system: "系统通知",
      user: "用户通知", 
      material: "素材通知",
      task_reminder: "任务提醒",
      other: "其他通知"
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
      message.success("删除成功");
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 获取平台显示名称
  const getPlatformName = (type: string) => {
    const { lng } = useParams();
    
    if (lng === 'en') {
      return type;
    }
    
    // 中文显示名称
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

  // 根据accountId获取账号信息
  const getAccountById = (accountId: string): SocialAccount | null => {
    return accountList.find(account => account.id === accountId) || null;
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

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      fetchUnreadCount();
      fetchAccountList();
    }
  }, [visible, token]);

  return (
    <>
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge count={unreadCount} size="small">
              <span style={{ fontSize: '16px', fontWeight: '600' }}>消息通知</span>
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
            {t('actions.cancel')}
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
                        onClick={() => handleMarkAsRead(item.id)}
                      >
                        {t('markAsRead')}
                      </Button>
                    ),
                    <Popconfirm
                      key="delete"
                      title="确定要删除这条通知吗？"
                      onConfirm={() => handleDeleteNotification(item.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
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
                        <div className={styles.actions}>
                          <Tooltip title="查看详情">
                            <Button 
                              type="link" 
                              size="small" 
                              icon={<EyeOutlined />}
                              onClick={() => handleViewDetail(item)}
                            >
                              {t('viewAll')}
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    }
                  />
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
            <span style={{ fontSize: '16px', fontWeight: '600' }}>通知详情</span>
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
                   创建时间: {formatTime(selectedNotification.createdAt)}
                 </span>
                 {selectedNotification.readAt && (
                   <span style={{ color: '#52c41a' }}>
                     已读时间: {formatTime(selectedNotification.readAt)}
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
                 <h4 style={{ marginBottom: '16px', color: '#1890ff' }}>任务详情</h4>
                 <Spin spinning={taskLoading}>
                   {selectedTask ? (
                     <div className={styles.taskInfo}>
                       <div className={styles.taskHeader}>
                         <h5>{selectedTask.title}</h5>
                         <Tag color={selectedTask.status === 'active' ? 'green' : 'red'}>
                           {selectedTask.status === 'active' ? '进行中' : '已结束'}
                         </Tag>
                       </div>
                       <div className={styles.taskContent}>
                         <p><strong>描述：</strong>
                           <div dangerouslySetInnerHTML={{ __html: selectedTask.description }} />
                         </p>
                         {/* 发布账号信息 */}
                         {selectedTask.accountId && (() => {
                           const publishAccount = getAccountById(selectedTask.accountId);
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
                         <p><strong>奖励：</strong>¥{selectedTask.reward}</p>
                         {/* <p><strong>招募人数：</strong>{selectedTask.currentRecruits}/{selectedTask.maxRecruits}</p> */}

                                                   <p><strong>任务类型：</strong>
                            <Tag color="blue" style={{ marginLeft: '4px' }}>
                              {getTaskTypeName(selectedTask.type)}
                            </Tag>
                          </p>
                         {/* {selectedTask.accountTypes && selectedTask.accountTypes.length > 0 && (
                           <p><strong>账号类型：</strong>
                             {selectedTask.accountTypes.map(type => (
                               <Tag key={type} style={{ marginLeft: '4px' }}>{getPlatformName(type)}</Tag>
                             ))}
                           </p>
                         )} */}
                         
                         {/* 任务素材展示 */}
                         {selectedTask.materials && selectedTask.materials.length > 0 && (
                           <div style={{ marginTop: '16px' }}>
                             <p><strong>任务素材：</strong></p>
                             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                               {selectedTask.materials.map((material: any, index: number) => (
                                 <div key={index} style={{ 
                                   border: '1px solid #e8e8e8', 
                                   borderRadius: '8px', 
                                   padding: '8px',
                                   maxWidth: '200px'
                                 }}>
                                   <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                     {material.title}
                                   </div>
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
                                   <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                                     {material.desc?.substring(0, 50)}{material.desc?.length > 50 ? '...' : ''}
                                   </div>
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
                                                 fontSize: '12px',
                                                 background: 'rgba(0,0,0,0.6)',
                                                 borderRadius: '50%',
                                                 width: '16px',
                                                 height: '16px',
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
                                       <strong>⚠️ 注意：</strong>
                                       发布账号({getPlatformName(publishAccount.type)})的任务需要在移动端App中操作，请下载对应App后继续。
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
                             接受任务
                           </Button>
                         </div>
                       )}
                     </div>
                   ) : !taskLoading && (
                     <div style={{ textAlign: 'center', color: '#999' }}>
                       暂无任务详情
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
      />

      {/* 媒体预览弹窗 */}
      <Modal
        title={previewMedia?.title || '媒体预览'}
        open={mediaPreviewVisible}
        onCancel={() => {
          setMediaPreviewVisible(false);
          setPreviewMedia(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setMediaPreviewVisible(false);
            setPreviewMedia(null);
          }}>
            关闭
          </Button>
        ]}
        width={previewMedia?.type === 'video' ? 800 : 600}
        zIndex={3000}
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
                src={previewMedia.url}
                controls
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  borderRadius: '8px'
                }}
                autoPlay
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
    </>
  );
};

export default NotificationPanel;