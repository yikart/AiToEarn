import type { MessageInstance } from 'antd/es/message/interface'
import type { HookAPI } from 'antd/es/modal/useModal'
import type { NotificationInstance } from 'antd/es/notification/interface'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

interface IUseConfigStore {
  // 全局 modal
  globalModal?: HookAPI
  // 全局 通知
  globalNotificationApi?: NotificationInstance
  // 全局 消息提示
  globalMessageApi?: MessageInstance
}

const store: IUseConfigStore = {
  globalModal: undefined,
  globalMessageApi: undefined,
  globalNotificationApi: undefined,
}

export const useConfigStore = create(
  combine(
    {
      ...store,
    },
    (set, getState) => ({
      setGlobal: (
        globalModal: HookAPI,
        globalNotificationApi: NotificationInstance,
        globalMessageApi: MessageInstance,
      ) => {
        set({ globalModal, globalNotificationApi, globalMessageApi })
      },
    }),
  ),
)

export const messageApi = {
  get value() {
    return useConfigStore.getState().globalMessageApi!
  },
}

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
