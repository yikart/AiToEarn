import type { HookAPI } from 'antd/es/modal/useModal'
import type { NotificationInstance } from 'antd/es/notification/interface'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

interface IUseConfigStore {
  // 全局 modal
  globalModal?: HookAPI
  // 全局 通知
  globalNotificationApi?: NotificationInstance
}

const store: IUseConfigStore = {
  globalModal: undefined,
  globalNotificationApi: undefined,
}

export const useConfigStore = create(
  combine(
    {
      ...store,
    },
    (set, _getState) => ({
      setGlobal: (
        globalModal: HookAPI,
        globalNotificationApi: NotificationInstance,
      ) => {
        set({ globalModal, globalNotificationApi })
      },
    }),
  ),
)

export const notificationApi = {
  get value() {
    return useConfigStore.getState().globalNotificationApi!
  },
}

export const modalApi = {
  get value() {
    return useConfigStore.getState().globalModal!
  },
}
