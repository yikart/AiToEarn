/**
 * ChannelManager - 频道管理器局部状态管理
 * 只管理弹窗显示隐藏状态，所有数据使用全局 account store
 */

import { create } from 'zustand'
import { combine } from 'zustand/middleware'

export interface ChannelManagerState {
  /** 弹窗是否打开 */
  open: boolean
}

const initialState: ChannelManagerState = {
  open: false,
}

export const useChannelManagerStore = create(
  combine(initialState, set => ({
    /** 设置弹窗开关状态 */
    setOpen: (open: boolean) => {
      set({ open })
    },
  })),
)
