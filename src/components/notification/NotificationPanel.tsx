"use client";

import React, { useState, useEffect } from "react";
import { Badge, Button, List, Modal, message, Spin, Empty } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  getNotificationList, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount,
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
      await markNotificationAsRead(id);
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
  const handleViewDetail = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setDetailModalVisible(true);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
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
      other: "其他通知"
    };
    return typeMap[type] || type;
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
        title="消息通知1"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="markAll" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
            全部标记为已读
          </Button>,
          <Button key="close" onClick={onClose}>
            关闭
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        <Spin spinning={loading}>
          {notifications.length > 0 ? (
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item
                  className={`${styles.notificationItem} ${!item.isRead ? styles.unread : ""}`}
                  actions={[
                    !item.isRead && (
                      <Button
                        key="mark"
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkAsRead(item.id)}
                                              >
                          标记为已读
                        </Button>
                    )
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div className={styles.notificationTitle}>
                        <span>{item.title}</span>
                        {!item.isRead && <Badge status="processing" />}
                      </div>
                    }
                    description={
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationMeta}>
                          <span className={styles.type}>{getNotificationTypeText(item.type)}</span>
                          <span className={styles.time}>{formatTime(item.createdAt)}</span>
                        </div>
                        <div className={styles.content}>
                          {item.content.length > 100 
                            ? `${item.content.substring(0, 100)}...` 
                            : item.content
                          }
                        </div>
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => handleViewDetail(item)}
                        >
                          查看详情
                        </Button>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无消息" />
          )}
        </Spin>
      </Modal>

      {/* 通知详情弹窗 */}
      <Modal
        title="通知详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={500}
      >
        {selectedNotification && (
          <div className={styles.notificationDetail}>
            <h3>{selectedNotification.title}</h3>
            <div className={styles.meta}>
              <span>类型: {getNotificationTypeText(selectedNotification.type)}</span>
              <span>时间: {formatTime(selectedNotification.createdAt)}</span>
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