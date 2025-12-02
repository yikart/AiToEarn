/**
 * 浏览器插件状态管理 Store
 */

import type {
  PlatAccountInfo,
  PlatformPublishTask,
  PluginPlatformType,
  PluginStore,
  ProgressCallback,
  PublishParams,
  PublishTask,
  PublishTaskListConfig,
} from './types/baseTypes'
import { create } from 'zustand'
import { PlatType } from '@/app/config/platConfig'
import { DEFAULT_POLLING_INTERVAL } from './constants'
import { PlatformTaskStatus, PLUGIN_SUPPORTED_PLATFORMS, PluginStatus as Status } from './types/baseTypes'

/**
 * 错误消息（store 内部使用，不走 i18n）
 * 注意：组件中应使用 ERROR_MESSAGE_I18N_KEY 配合 t() 函数
 */
const ERROR_MESSAGES = {
  PLUGIN_NOT_INSTALLED: '请先安装 AIToEarn 浏览器插件',
  PLUGIN_NOT_READY: '插件未就绪，请先授权插件权限',
  PUBLISHING_IN_PROGRESS: '当前正在发布中，请稍后再试',
} as const

/**
 * 平台账号信息映射
 */
export type PlatformAccountsMap = Record<PluginPlatformType, PlatAccountInfo | null>

/**
 * 扩展的插件 Store 接口（包含任务列表）
 */
interface ExtendedPluginStore extends PluginStore {
  /** 发布任务列表 */
  publishTasks: PublishTask[]

  /** 任务列表配置 */
  taskListConfig: PublishTaskListConfig

  /** 各平台登录账号信息 */
  platformAccounts: PlatformAccountsMap

  /** 初始化方法 */
  init: () => Promise<void>

  /** 检查插件权限 */
  checkPermission: () => Promise<boolean>

  /** 添加发布任务 */
  addPublishTask: (task: Omit<PublishTask, 'id' | 'createdAt' | 'updatedAt' | 'overallStatus'>) => string

  /** 更新平台任务 */
  updatePlatformTask: (taskId: string, platform: PluginPlatformType, updates: Partial<PlatformPublishTask>) => void

  /** 删除发布任务 */
  deletePublishTask: (taskId: string) => void

  /** 清空所有任务 */
  clearPublishTasks: () => void

  /** 获取任务详情 */
  getPublishTask: (taskId: string) => PublishTask | undefined

  /** 更新任务列表配置 */
  updateTaskListConfig: (config: Partial<PublishTaskListConfig>) => void

  /** 刷新所有平台账号信息 */
  refreshAllPlatformAccounts: () => Promise<void>
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 计算整体任务状态
 */
function calculateOverallStatus(platformTasks: PlatformPublishTask[]): PlatformTaskStatus {
  if (platformTasks.every(task => task.status === PlatformTaskStatus.COMPLETED)) {
    return PlatformTaskStatus.COMPLETED
  }
  if (platformTasks.some(task => task.status === PlatformTaskStatus.PUBLISHING)) {
    return PlatformTaskStatus.PUBLISHING
  }
  if (platformTasks.some(task => task.status === PlatformTaskStatus.ERROR)) {
    return PlatformTaskStatus.ERROR
  }
  return PlatformTaskStatus.PENDING
}

/**
 * 创建初始平台账号映射
 */
function createInitialPlatformAccounts(): PlatformAccountsMap {
  const accounts: Partial<PlatformAccountsMap> = {}
  for (const platform of PLUGIN_SUPPORTED_PLATFORMS) {
    accounts[platform] = null
  }
  return accounts as PlatformAccountsMap
}

/**
 * 创建插件管理 Store
 */
export const usePluginStore = create<ExtendedPluginStore>()((set, get) => ({
  // ==================== 基础状态 ====================
  status: Status.UNKNOWN,
  pollingTimer: null,
  isPublishing: false,
  publishProgress: null,

  // ==================== 任务列表状态 ====================
  publishTasks: [],
  taskListConfig: {
    maxTasks: 100,
    autoCleanCompleted: false,
    cleanAfter: 24 * 60 * 60 * 1000, // 24小时
  },

  // ==================== 平台账号状态 ====================
  platformAccounts: createInitialPlatformAccounts(),

  // ==================== 基础方法 ====================

  /**
   * 检查插件是否可用（仅检测是否安装，不检测权限）
   */
  checkPlugin: () => {
    const isAvailable
      = typeof window !== 'undefined' && !!window.AIToEarnPlugin

    // 如果插件未安装，直接设置状态
    if (!isAvailable) {
      set({ status: Status.NOT_INSTALLED })
      return false
    }

    // 插件已安装，但此方法不检测权限，保持当前状态或设置为检测中
    const currentStatus = get().status
    if (currentStatus === Status.UNKNOWN || currentStatus === Status.NOT_INSTALLED) {
      set({ status: Status.CHECKING })
    }

    return true
  },

  /**
   * 检查插件权限
   */
  checkPermission: async () => {
    const isInstalled = typeof window !== 'undefined' && !!window.AIToEarnPlugin

    if (!isInstalled) {
      set({ status: Status.NOT_INSTALLED })
      return false
    }

    try {
      const result = await window.AIToEarnPlugin!.checkPermission()

      if (result.granted) {
        set({ status: Status.READY })
        return true
      }
      else {
        set({ status: Status.INSTALLED_NO_PERMISSION })
        return false
      }
    }
    catch (error) {
      console.error('权限检查失败:', error)
      // 如果权限检查失败，视为未授权
      set({ status: Status.INSTALLED_NO_PERMISSION })
      return false
    }
  },

  /**
   * 初始化方法
   * 检查插件状态和权限，如果已就绪则获取所有平台的账号信息
   */
  init: async () => {
    const { checkPlugin, checkPermission, refreshAllPlatformAccounts } = get()

    // 检查插件是否安装
    const isInstalled = checkPlugin()

    if (!isInstalled) {
      return
    }

    // 检查插件权限
    const hasPermission = await checkPermission()

    if (hasPermission) {
      // 插件已就绪，获取所有平台账号信息
      await refreshAllPlatformAccounts()
    }
  },

  /**
   * 刷新所有平台账号信息
   */
  refreshAllPlatformAccounts: async () => {
    const { status } = get()

    // 只有在插件就绪状态下才能刷新账号信息
    if (status !== Status.READY) {
      return
    }

    const accounts: Partial<PlatformAccountsMap> = {}

    // 并行获取所有平台的账号信息
    await Promise.all(
      PLUGIN_SUPPORTED_PLATFORMS.map(async (platform) => {
        try {
          const accountInfo = await window.AIToEarnPlugin!.login(platform)
          accounts[platform] = accountInfo
        }
        catch {
          // 未登录或获取失败，设置为 null
          accounts[platform] = null
        }
      }),
    )

    set({ platformAccounts: accounts as PlatformAccountsMap })
  },

  /**
   * 开始轮询插件状态
   */
  startPolling: (interval = DEFAULT_POLLING_INTERVAL) => {
    const { pollingTimer, stopPolling, checkPlugin } = get()

    if (pollingTimer) {
      stopPolling()
    }

    set({ status: Status.CHECKING })
    checkPlugin()

    const timer = setInterval(() => {
      checkPlugin()
    }, interval)

    set({ pollingTimer: timer })
  },

  /**
   * 停止轮询插件状态
   */
  stopPolling: () => {
    const { pollingTimer } = get()

    if (pollingTimer) {
      clearInterval(pollingTimer)
      set({ pollingTimer: null })
    }
  },

  /**
   * 登录到指定平台
   */
  login: async (platform: PluginPlatformType) => {
    const { status, platformAccounts } = get()

    if (status === Status.NOT_INSTALLED) {
      throw new Error(ERROR_MESSAGES.PLUGIN_NOT_INSTALLED)
    }

    if (status !== Status.READY) {
      throw new Error(ERROR_MESSAGES.PLUGIN_NOT_READY)
    }

    try {
      const result = await window.AIToEarnPlugin!.login(platform)

      // 更新平台账号信息
      set({
        platformAccounts: {
          ...platformAccounts,
          [platform]: result,
        },
      })

      return result
    }
    catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  /**
   * 发布内容到指定平台
   */
  publish: async (params: PublishParams, onProgress?: ProgressCallback) => {
    const { status } = get()

    if (status === Status.NOT_INSTALLED) {
      throw new Error(ERROR_MESSAGES.PLUGIN_NOT_INSTALLED)
    }

    if (status !== Status.READY) {
      throw new Error(ERROR_MESSAGES.PLUGIN_NOT_READY)
    }

    if (get().isPublishing) {
      throw new Error(ERROR_MESSAGES.PUBLISHING_IN_PROGRESS)
    }

    set({
      isPublishing: true,
      publishProgress: {
        stage: 'download',
        progress: 0,
        message: '准备发布...',
        timestamp: Date.now(),
      },
    })

    try {
      const result = await window.AIToEarnPlugin!.publish(
        params,
        (progress) => {
          set({ publishProgress: progress })
          if (onProgress) {
            onProgress(progress)
          }
        },
      )

      set({
        isPublishing: false,
        publishProgress: {
          stage: 'complete',
          progress: 100,
          message: '发布成功',
          timestamp: Date.now(),
        },
      })

      return result
    }
    catch (error) {
      set({
        isPublishing: false,
        publishProgress: {
          stage: 'error',
          progress: 0,
          message: error instanceof Error ? error.message : '发布失败',
          timestamp: Date.now(),
        },
      })

      console.error('发布失败:', error)
      throw error
    }
  },

  /**
   * 重置发布状态
   */
  resetPublishState: () => {
    set({
      isPublishing: false,
      publishProgress: null,
    })
  },

  // ==================== 任务列表方法 ====================

  /**
   * 添加发布任务
   */
  addPublishTask: (task) => {
    const id = generateId()
    const now = Date.now()

    const newTask: PublishTask = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now,
      overallStatus: calculateOverallStatus(task.platformTasks),
    }

    set((state) => {
      const tasks = [newTask, ...state.publishTasks]

      // 如果超过最大任务数，移除最旧的
      if (state.taskListConfig.maxTasks && tasks.length > state.taskListConfig.maxTasks) {
        tasks.splice(state.taskListConfig.maxTasks)
      }

      return { publishTasks: tasks }
    })

    return id
  },

  /**
   * 更新平台任务
   */
  updatePlatformTask: (taskId, platform, updates) => {
    set((state) => {
      const tasks = state.publishTasks.map((task) => {
        if (task.id !== taskId)
          return task

        const platformTasks = task.platformTasks.map((pt: PlatformPublishTask) => {
          if (pt.platform !== platform)
            return pt

          return { ...pt, ...updates }
        })

        return {
          ...task,
          platformTasks,
          updatedAt: Date.now(),
          overallStatus: calculateOverallStatus(platformTasks),
        }
      })

      return { publishTasks: tasks }
    })
  },

  /**
   * 删除发布任务
   */
  deletePublishTask: (taskId) => {
    set(state => ({
      publishTasks: state.publishTasks.filter(task => task.id !== taskId),
    }))
  },

  /**
   * 清空所有任务
   */
  clearPublishTasks: () => {
    set({ publishTasks: [] })
  },

  /**
   * 获取任务详情
   */
  getPublishTask: (taskId) => {
    return get().publishTasks.find(task => task.id === taskId)
  },

  /**
   * 更新任务列表配置
   */
  updateTaskListConfig: (config) => {
    set(state => ({
      taskListConfig: { ...state.taskListConfig, ...config },
    }))
  },
}))
