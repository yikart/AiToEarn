"use client";

import React, { useState, useEffect } from "react";
import { List, Button, message, Spin, Empty, Tabs, Badge, Modal } from "antd";
import { CheckOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useTransClient } from "@/app/i18n/client";
import { useUserStore } from "@/store/user";
import { 
  getNotificationList, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  type NotificationItem 
} from "@/api/notification";
import styles from "./notification.module.scss";

const NotificationPage = () => {
  const { t } = useTransClient("common");
  const token = useUserStore((state) => state.token);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // 获取通知列表
  const fetchNotifications = async (type?: string) => {
    // 如果没有登录信息，不发送请求
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const params: any = { page: 1, pageSize: 50 };
      if (type && type !== "all") {
        params.type = type;
      }
      const response = await getNotificationList(params);
      if (response && response.data) {
        setNotifications(response.data.list || []);
      }
    } catch (error) {
      message.error("获取通知列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 标记单个通知为已读
  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    
    try {
      await markNotificationAsRead(id);
      message.success("标记成功");
      fetchNotifications(activeTab === "all" ? undefined : activeTab);
    } catch (error) {
      message.error("标记失败");
    }
  };

  // 全部标记为已读
  const handleMarkAllAsRead = async () => {
    if (!token) return;
    
    try {
      await markAllNotificationsAsRead();
      message.success("全部标记成功");
      fetchNotifications(activeTab === "all" ? undefined : activeTab);
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

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchNotifications(key === "all" ? undefined : key);
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  return (
    <div className={styles.notificationPage}>
      <div className={styles.container}>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          items={[
            {
              key: "all",
              label: "全部通知",
              children: (
                <div className={styles.notificationList}>
                  <div className={styles.header}>
                    <h2>全部通知</h2>
                    <Button 
                      type="primary" 
                      icon={<CheckCircleOutlined />}
                      onClick={handleMarkAllAsRead}
                      disabled={!notifications.some(n => !n.isRead) || !token}
                    >
                      全部标记为已读
                    </Button>
                  </div>
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
                                    {item.content.length > 200 
                                      ? `${item.content.substring(0, 200)}...` 
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
                </div>
              ),
            }
          ]}
          className={styles.tabs}
        />
      </div>

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
        width={600}
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
    </div>
  );
};

export default NotificationPage; 