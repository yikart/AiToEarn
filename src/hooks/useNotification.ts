import { useState, useEffect, useCallback } from "react";
import { getUnreadCount } from "@/api/notification";

export const useNotification = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // 初始获取
    fetchUnreadCount();

    // 每5秒获取一次未读数量
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);

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