import type { SettingsTab } from '@/components/SettingsModal'
import { create } from 'zustand'

interface LayoutSidebarState {
  /** 设置弹框是否可见 */
  settingsVisible: boolean
  /** 设置弹框默认 Tab */
  settingsDefaultTab?: SettingsTab
  /** 打开设置弹框，并可指定默认 Tab */
  openSettings: (defaultTab?: SettingsTab) => void
  /** 关闭设置弹框并重置默认 Tab */
  closeSettings: () => void
}

export const useLayoutSidebarStore = create<LayoutSidebarState>(set => ({
  settingsVisible: false,
  settingsDefaultTab: undefined,
  openSettings: (defaultTab?: SettingsTab) =>
    set({
      settingsVisible: true,
      settingsDefaultTab: defaultTab,
    }),
  closeSettings: () =>
    set({
      settingsVisible: false,
      settingsDefaultTab: undefined,
    }),
}))


