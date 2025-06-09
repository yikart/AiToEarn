import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { NotificationInstance } from 'antd/es/notification/interface';

export interface ICommontStore {
  // 全局通知api
  notification?: NotificationInstance;
}

const store: ICommontStore = {
  notification: undefined,
};

// 项目中的通用的、全局的状态和方法
export const useCommontStore = create(
  combine(
    {
      ...store,
    },
    (set, get, storeApi) => {
      const methods = {
        setNotification(notification: NotificationInstance) {
          set({
            notification,
          });
        },
      };
      return methods;
    },
  ),
);
