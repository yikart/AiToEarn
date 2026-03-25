import { create } from 'zustand'

type SettingsTab = 'profile' | 'general'

interface SettingsModalState {
  /** 设置弹框是否可见 */
  settingsVisible: boolean
  /** 设置弹框默认 Tab */
  settingsDefaultTab?: SettingsTab
  /** 设置弹框子 Tab（如 IncomeTab 内部的 balance / withdraw） */
  settingsSubTab?: string
  /** 打开设置弹框，并可指定默认 Tab 和选项 */
  openSettings: (defaultTab?: SettingsTab, options?: { subTab?: string }) => void
  /** 关闭设置弹框并重置默认 Tab */
  closeSettings: () => void
}

export const useSettingsModalStore = create<SettingsModalState>(set => ({
  settingsVisible: false,
  settingsDefaultTab: undefined,
  settingsSubTab: undefined,
  openSettings: (defaultTab?: SettingsTab, options?: { subTab?: string }) =>
    set({
      settingsVisible: true,
      settingsDefaultTab: defaultTab,
      settingsSubTab: options?.subTab,
    }),
  closeSettings: () =>
    set({
      settingsVisible: false,
      settingsDefaultTab: undefined,
      settingsSubTab: undefined,
    }),
}))
