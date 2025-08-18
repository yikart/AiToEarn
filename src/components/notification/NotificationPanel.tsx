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
  type NotificationItem 
} from "@/api/notification";
import styles from "./NotificationPanel.module.scss";

interface NotificationPanelProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ visible, onClose }) => {
  const { t } = useTransClient("common");
  const token = useUserStore((state) => state.token);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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
      const response = await getNotificationDetail(notification.id);
      if (response && response.data && response.data.data) {
        setSelectedNotification(response.data.data);
        setDetailModalVisible(true);
        
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

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      fetchUnreadCount();
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
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)} type="primary">
            关闭
          </Button>
        ]}
        width={600}
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
            <div className={styles.content}>
              {selectedNotification.content}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default NotificationPanel;