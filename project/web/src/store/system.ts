import { createPersistStore } from '@/utils/createPersistStore'

/** 主题类型 */
export type ThemeType = 'light' | 'dark' | 'system'

export interface ISystemStore {
  // 视频发布是否开启填写更多参数
  moreParamsOpen: boolean
  // 主题模式
  theme: ThemeType
}

const state: ISystemStore = {
  moreParamsOpen: false,
  theme: 'light',
}

export const useSystemStore = createPersistStore(
  {
    ...state,
  },
  (set, _get) => {
    const methods = {
      setMoreParamsOpen(moreParamsOpen: boolean) {
        set({
          moreParamsOpen,
        })
      },
      /** 设置主题 */
      setTheme(theme: ThemeType) {
        set({ theme })
        // 应用主题到 document
        applyTheme(theme)
      },
    }

    return methods
  },
  {
    name: 'System',
  },
)

/**
 * 应用主题到 document
 */
function applyTheme(theme: ThemeType) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
