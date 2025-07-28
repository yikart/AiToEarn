import http from "@/utils/request";

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: "system" | "user" | "material" | "other";
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  list: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationDetailResponse {
  data: NotificationItem;
}

export interface UnreadCountResponse {
  count: number;
}

// 获取用户通知列表
export const getNotificationList = (params: {
  page?: number;
  pageSize?: number;
  type?: string;
}) => {
  return http.get<NotificationListResponse>("notification", { params });
};

// 获取通知详情
export const getNotificationDetail = (id: string) => {
  return http.get<NotificationDetailResponse>(`notification/${id}`);
};

// 标记通知为已读
export const markNotificationAsRead = (id: string) => {
  return http.put(`notification/read`, { id });
};

// 全部标记为已读
export const markAllNotificationsAsRead = () => {
  return http.put("notification/read-all");
};

// 获取未读数量
export const getUnreadCount = () => {
  return http.get<UnreadCountResponse>("notification/unread-count");
}; 