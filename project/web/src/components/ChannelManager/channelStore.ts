/**
 * ChannelManager - 频道管理器局部状态管理
 * 只管理弹窗显示隐藏状态，所有数据使用全局account store
 */

import { create } from 'zustand'
import { combine } from 'zustand/middleware'

export interface ChannelManagerState {
  open: boolean
  _hasHydrated: boolean
}

const initialState: ChannelManagerState = {
  open: false,
  _hasHydrated: true,
}

export const useChannelManagerStore = create(
  combine(initialState, (set, get) => {
    return {
      // 设置弹窗开关
      setOpen: (open: boolean) => {
        set({ open })
      },
    }
  }),
)
