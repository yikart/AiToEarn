import { useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "@/api/notification";
import { useUserStore } from "@/store/user";

export const useNotification = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = useUserStore((state) => state.token);

  const fetchUnreadCount = useCallback(async () => {
    // 如果没有登录信息，不发送请求
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await getUnreadCount();
      if (response && response.data) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("获取未读数量失败:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // 初始获取
    fetchUnreadCount();

    // 每10秒获取一次未读数量
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount: fetchUnreadCount,
  };
}; 