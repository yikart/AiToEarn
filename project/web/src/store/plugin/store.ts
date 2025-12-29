/**
 * 浏览器插件状态管理 Store
 */

import type {
  PlatAccountInfo,
  PlatformPublishTask,
  PluginPlatformType,
  ProgressCallback,
  ProgressEvent,
  PublishParams,
  PublishTask,
  PublishTaskListConfig,
} from './types/baseTypes'
import type { SocialAccount } from '@/api/types/account.type'
import type { IImgFile, IPubParams, IVideoFile } from '@/components/PublishDialog/publishDialog.type'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import lodash from 'lodash'
import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import { createOrUpdateAccountApi } from '@/api/account'
import { apiCreatePublishRecord } from '@/api/plat/publish'
import { ClientType } from '@/app/[lng]/accounts/accounts.enums'
import { useDataStatisticsStore } from '@/app/[lng]/dataStatistics/useDataStatistics'
import { AccountStatus } from '@/app/config/accountConfig'
import { useAccountStore } from '@/store/account'
import { generateUUID, parseTopicString } from '@/utils'
import { getOssUrl } from '@/utils/oss'
import { DEFAULT_POLLING_INTERVAL } from './constants'
import { calculateOverallStatus, createInitialPlatformAccounts, generateId } from './plugin.utils'
import { PlatformTaskStatus, PLUGIN_SUPPORTED_PLATFORMS, PluginStatus as Status } from './types/baseTypes'

// 启用 dayjs utc 插件
dayjs.extend(utc)

/**
 * 插件发布项接口
 * 描述单个平台的发布内容
 */
export interface PluginPublishItem {
  /** 账号信息 */
  account: SocialAccount
  /** 发布参数 */
  params: IPubParams
}

/**
 * 单个平台发布进度事件（扩展 ProgressEvent，附带账号信息）
 */
export interface PlatformProgressEvent extends ProgressEvent {
  /** 账号ID */
  accountId: string
  /** 平台类型 */
  platform: PluginPlatformType
  /** 请求ID */
  requestId: string
}

/**
 * 发布进度回调类型
 */
export type ExecuteProgressCallback = (event: PlatformProgressEvent) => void

/**
 * 执行插件发布的参数
 */
export interface ExecutePluginPublishParams {
  /** 需要发布的项目列表 */
  items: PluginPublishItem[]
  /** 账号ID 到 requestId 的映射（用于进度匹配） */
  platformTaskIdMap: Map<string, string>
  /** 发布时间（ISO 格式字符串，可选，不传则立即发布） */
  publishTime?: string
  /** 发布进度回调（可选，每个平台发布时都会触发） */
  onProgress?: ExecuteProgressCallback
  /** 发布完成后的回调（可选） */
  onComplete?: () => void
}

/** 平台账号信息映射 */
export type PlatformAccountsMap = Record<PluginPlatformType, PlatAccountInfo | null>

/** 错误消息 */
const ERROR_MESSAGES = {
  PLUGIN_NOT_INSTALLED: '请先安装 Aitoearn 浏览器插件',
  PLUGIN_NOT_READY: '插件未就绪，请先授权插件权限',
  PUBLISHING_IN_PROGRESS: '当前正在发布中，请稍后再试',
} as const

/**
 * 生成发布标识key（用于区分不同账号的发布）
 * @param platform 平台类型
 * @param accountId 账号ID（可选）
 */
function getPublishKey(platform: PluginPlatformType, accountId?: string): string {
  return accountId ? `${platform}-${accountId}` : platform
}

/** 平台发布进度映射，key 为 platform 或 platform-accountId */
export type PlatformProgressMap = Map<string, ProgressEvent>

/** 插件 Store 状态接口（只定义属性） */
export interface IPluginStore {
  status: Status
  pollingTimer: NodeJS.Timeout | null
  /** 插件是否正在初始化（检测插件、权限、账号登录状态） */
  isInitializing: boolean
  /** 是否正在发布（任意平台） */
  isPublishing: boolean
  /** 正在发布的集合，key 为 platform 或 platform-accountId，支持同一平台多账号同时发布 */
  publishingPlatforms: Set<string>
  /** 当前发布进度（最新一个） */
  publishProgress: ProgressEvent | null
  /** 各平台发布进度，key 为 platform 或 platform-accountId */
  platformProgress: PlatformProgressMap
  publishTasks: PublishTask[]
  taskListConfig: PublishTaskListConfig
  platformAccounts: PlatformAccountsMap
}

const store: IPluginStore = {
  status: Status.UNKNOWN,
  pollingTimer: null,
  isInitializing: true, // 初始状态为正在初始化
  isPublishing: false,
  publishingPlatforms: new Set(),
  publishProgress: null,
  platformProgress: new Map(),
  publishTasks: [],
  taskListConfig: {
    maxTasks: 100,
    autoCleanCompleted: false,
    cleanAfter: 24 * 60 * 60 * 1000,
  },
  platformAccounts: createInitialPlatformAccounts(),
}

function getStore() {
  return lodash.cloneDeep(store)
}

/** 创建插件管理 Store */
export const usePluginStore = create(
  combine(
    { ...getStore() },
    (set, get) => {
      const methods = {
        clear() {
          set({ ...getStore() })
        },

        /** 检查插件是否安装 */
        checkPlugin() {
          const isAvailable = typeof window !== 'undefined' && !!window.AIToEarnPlugin

          if (!isAvailable) {
            set({ status: Status.NOT_INSTALLED })
            return false
          }
          const currentStatus = get().status
          if (currentStatus === Status.UNKNOWN || currentStatus === Status.NOT_INSTALLED) {
            set({ status: Status.CHECKING })
          }
          return true
        },

        /** 检查插件权限 */
        async checkPermission() {
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
            set({ status: Status.INSTALLED_NO_PERMISSION })
            return false
          }
        },

        /** 开始轮询插件状态 */
        startPolling(interval = DEFAULT_POLLING_INTERVAL) {
          const { pollingTimer } = get()
          if (pollingTimer)
            methods.stopPolling()

          set({ status: Status.CHECKING })

          const poll = async () => {
            const isInstalled = methods.checkPlugin()
            if (!isInstalled)
              return

            const hasPermission = await methods.checkPermission()
            // 已安装且已授权，停止轮询并刷新账号信息
            if (hasPermission) {
              methods.stopPolling()
              await methods.refreshAllPlatformAccounts()
            }
          }

          poll()
          const timer = setInterval(poll, interval)
          set({ pollingTimer: timer })
        },

        /** 停止轮询插件状态 */
        stopPolling() {
          const { pollingTimer } = get()
          if (pollingTimer) {
            clearInterval(pollingTimer)
            set({ pollingTimer: null })
          }
        },

        /**
         * 初始化方法
         * 1. 先将所有抖音和小红书账号设为离线
         * 2. 检查插件状态，未安装或未授权则轮询，已就绪则刷新账号
         */
        async init() {
          // 设置初始化状态
          set({ isInitializing: true })

          // 先将所有插件支持的平台账号设为离线
          methods.setAllPluginAccountsOffline()

          const isInstalled = methods.checkPlugin()
          if (!isInstalled) {
            // 未安装，开始轮询，初始化完成
            set({ isInitializing: false })
            methods.startPolling()
            return
          }

          const hasPermission = await methods.checkPermission()
          if (!hasPermission) {
            // 未授权，开始轮询，初始化完成
            set({ isInitializing: false })
            methods.startPolling()
            return
          }

          // 已就绪，刷新账号信息
          await methods.refreshAllPlatformAccounts()
          // 初始化完成
          set({ isInitializing: false })
        },

        /** 将所有插件支持的平台账号设为离线 */
        setAllPluginAccountsOffline() {
          const { accountList, accountMap, accountAccountMap } = useAccountStore.getState()
          let hasChange = false

          const updatedAccountList = accountList.map((acc) => {
            if (!PLUGIN_SUPPORTED_PLATFORMS.includes(acc.type as any))
              return acc

            if (acc.status !== AccountStatus.DISABLE) {
              hasChange = true
              const updatedAccount = { ...acc, status: AccountStatus.DISABLE }
              accountMap.set(acc.id, updatedAccount)
              accountAccountMap.set(acc.account, updatedAccount)
              return updatedAccount
            }
            return acc
          })

          if (hasChange) {
            useAccountStore.setState({
              accountList: updatedAccountList,
              accountMap: new Map(accountMap),
              accountAccountMap: new Map(accountAccountMap),
            })
          }
        },

        /**
         * 同步账号状态（仅当插件已就绪时执行）
         * 用于刷新账号列表后，不重新授权，只同步在线/离线状态
         */
        async syncAccountStatus() {
          methods.setAllPluginAccountsOffline()
          const { status } = get()
          if (status === Status.READY) {
            await methods.refreshAllPlatformAccounts()
          }
        },

        /** 刷新所有平台账号信息，并同步更新 accountList 中的在线/离线状态 */
        async refreshAllPlatformAccounts() {
          const { status } = get()
          if (status !== Status.READY)
            return

          const accounts: Partial<PlatformAccountsMap> = {}

          await Promise.all(
            PLUGIN_SUPPORTED_PLATFORMS.map(async (platform) => {
              try {
                accounts[platform] = await window.AIToEarnPlugin!.login(platform)
              }
              catch {
                accounts[platform] = null
              }
            }),
          )

          set({ platformAccounts: accounts as PlatformAccountsMap })

          // 根据 platformAccounts 更新 accountList 中的在线/离线状态
          const { accountList, accountMap, accountAccountMap } = useAccountStore.getState()
          let hasChange = false

          const updatedAccountList = accountList.map((acc) => {
            if (!PLUGIN_SUPPORTED_PLATFORMS.includes(acc.type as any))
              return acc

            const platformAccount = accounts[acc.type as keyof typeof accounts]
            const shouldBeOnline = platformAccount?.uid === acc.uid
            const newStatus = shouldBeOnline ? AccountStatus.USABLE : AccountStatus.DISABLE

            if (acc.status !== newStatus) {
              hasChange = true
              const updatedAccount = { ...acc, status: newStatus }
              accountMap.set(acc.id, updatedAccount)
              accountAccountMap.set(acc.account, updatedAccount)
              return updatedAccount
            }
            return acc
          })

          if (hasChange) {
            useAccountStore.setState({
              accountList: updatedAccountList,
              accountMap: new Map(accountMap),
              accountAccountMap: new Map(accountAccountMap),
            })
          }
        },

        /** 同步插件账号到数据库 */
        async syncAccountToDatabase(platform: PluginPlatformType, groupId?: string) {
          const { platformAccounts } = get()
          const account = platformAccounts[platform]

          if (!account) {
            console.warn('同步账号失败：该平台未登录', platform)
            return null
          }

          try {
            const accountData: Partial<SocialAccount> = {
              type: platform,
              uid: account.uid,
              account: account.account || account.uid,
              avatar: account.avatar,
              nickname: account.nickname,
              fansCount: account.fansCount || 0,
              loginCookie: account.loginCookie,
              status: AccountStatus.USABLE,
              // @ts-ignore
              clientType: ClientType.WEB,
            }

            if (groupId)
              accountData.groupId = groupId

            const result = await createOrUpdateAccountApi(accountData)

            if (result?.code === 0) {
              await useAccountStore.getState().getAccountList()
              return result.data || null
            }
            else {
              console.error('同步账号失败:', result?.message)
              return null
            }
          }
          catch (error) {
            console.error('同步账号到数据库失败:', error)
            return null
          }
        },

        /** 登录到指定平台 */
        async login(platform: PluginPlatformType) {
          const { status, platformAccounts } = get()

          if (status === Status.NOT_INSTALLED)
            throw new Error(ERROR_MESSAGES.PLUGIN_NOT_INSTALLED)

          if (status !== Status.READY)
            throw new Error(ERROR_MESSAGES.PLUGIN_NOT_READY)

          try {
            const result = await window.AIToEarnPlugin!.login(platform)
            set({
              platformAccounts: { ...platformAccounts, [platform]: result },
            })
            return result
          }
          catch (error) {
            console.error('登录失败:', error)
            throw error
          }
        },

        /** 发布内容到指定平台 */
        async publish(params: PublishParams, onProgress?: ProgressCallback) {
          const { status, publishingPlatforms, platformProgress } = get()

          // 解析话题
          const { topics, cleanedString } = parseTopicString(params.desc || '')
          params.topics = [...new Set(params.topics?.concat(topics))]
          params.desc = cleanedString

          const platform = params.platform
          const accountId = params.accountId
          // 使用 platform + accountId 作为唯一标识，支持同一平台多账号同时发布
          const publishKey = getPublishKey(platform, accountId)

          if (status === Status.NOT_INSTALLED)
            throw new Error(ERROR_MESSAGES.PLUGIN_NOT_INSTALLED)

          if (status !== Status.READY)
            throw new Error(ERROR_MESSAGES.PLUGIN_NOT_READY)

          // 检查该账号是否正在发布（同一平台不同账号可以同时发布）
          if (publishingPlatforms.has(publishKey))
            throw new Error(`${platform} ${ERROR_MESSAGES.PUBLISHING_IN_PROGRESS}`)

          // 标记该账号正在发布，并初始化进度
          const newPublishingPlatforms = new Set(publishingPlatforms)
          newPublishingPlatforms.add(publishKey)
          const newPlatformProgress = new Map(platformProgress)
          const initialProgress: ProgressEvent = { stage: 'download', progress: 0, message: '准备发布...', timestamp: Date.now() }
          newPlatformProgress.set(publishKey, initialProgress)

          set({
            isPublishing: newPublishingPlatforms.size > 0,
            publishingPlatforms: newPublishingPlatforms,
            publishProgress: initialProgress,
            platformProgress: newPlatformProgress,
          })

          try {
            const result = await window.AIToEarnPlugin!.publish(params, (progress) => {
              // 更新该账号的进度
              const updatedProgress = new Map(get().platformProgress)
              updatedProgress.set(publishKey, progress)
              set({
                publishProgress: progress,
                platformProgress: updatedProgress,
              })
              onProgress?.(progress)
            })

            // 发布完成，移除该账号的发布状态，更新进度为完成
            const updatedPlatforms = new Set(get().publishingPlatforms)
            updatedPlatforms.delete(publishKey)
            const completedProgress: ProgressEvent = { stage: 'complete', progress: 100, message: '发布成功', timestamp: Date.now() }
            const updatedPlatformProgress = new Map(get().platformProgress)
            updatedPlatformProgress.set(publishKey, completedProgress)

            set({
              isPublishing: updatedPlatforms.size > 0,
              publishingPlatforms: updatedPlatforms,
              publishProgress: completedProgress,
              platformProgress: updatedPlatformProgress,
            })

            return result
          }
          catch (error) {
            // 发布失败，移除该账号的发布状态，更新进度为错误
            const updatedPlatforms = new Set(get().publishingPlatforms)
            updatedPlatforms.delete(publishKey)
            const errorProgress: ProgressEvent = {
              stage: 'error',
              progress: 0,
              message: error instanceof Error ? error.message : '发布失败',
              timestamp: Date.now(),
            }
            const updatedPlatformProgress = new Map(get().platformProgress)
            updatedPlatformProgress.set(publishKey, errorProgress)

            set({
              isPublishing: updatedPlatforms.size > 0,
              publishingPlatforms: updatedPlatforms,
              publishProgress: errorProgress,
              platformProgress: updatedPlatformProgress,
            })
            console.error('发布失败:', error)
            throw error
          }
        },

        /** 重置发布状态 */
        resetPublishState() {
          set({
            isPublishing: false,
            publishingPlatforms: new Set(),
            publishProgress: null,
            platformProgress: new Map(),
          })
        },

        /** 获取指定平台/账号的发布进度 */
        getPlatformProgress(platform: PluginPlatformType, accountId?: string) {
          const publishKey = getPublishKey(platform, accountId)
          return get().platformProgress.get(publishKey) || null
        },

        /** 清除指定平台/账号的发布进度 */
        clearPlatformProgress(platform: PluginPlatformType, accountId?: string) {
          const publishKey = getPublishKey(platform, accountId)
          const updatedProgress = new Map(get().platformProgress)
          updatedProgress.delete(publishKey)
          set({ platformProgress: updatedProgress })
        },

        /** 添加发布任务 */
        addPublishTask(task: Omit<PublishTask, 'id' | 'createdAt' | 'updatedAt' | 'overallStatus'>) {
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
            if (state.taskListConfig.maxTasks && tasks.length > state.taskListConfig.maxTasks) {
              tasks.splice(state.taskListConfig.maxTasks)
            }
            return { publishTasks: tasks }
          })

          return id
        },

        /**
         * 更新平台任务（使用平台任务ID精确匹配）
         * @param taskId 发布任务ID
         * @param platformTaskId 平台任务ID（精确匹配）
         * @param updates 更新内容
         */
        updatePlatformTask(
          taskId: string,
          platformTaskId: string,
          updates: Partial<PlatformPublishTask>,
        ) {
          set((state) => {
            const tasks = state.publishTasks.map((task) => {
              if (task.id !== taskId)
                return task

              const platformTasks = task.platformTasks.map((pt: PlatformPublishTask) => {
                // 使用平台任务ID精确匹配
                if (pt.id !== platformTaskId)
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
         * 通过 requestId 更新平台任务进度（插件回调使用）
         * @param requestId 插件返回的请求ID
         * @param updates 更新内容
         */
        updatePlatformTaskByRequestId(
          requestId: string,
          updates: Partial<PlatformPublishTask>,
        ) {
          set((state) => {
            const tasks = state.publishTasks.map((task) => {
              // 在该任务的所有平台任务中查找匹配的 requestId
              const hasMatch = task.platformTasks.some(pt => pt.requestId === requestId)

              if (!hasMatch)
                return task

              const platformTasks = task.platformTasks.map((pt: PlatformPublishTask) => {
                // 使用 requestId 精确匹配
                if (pt.requestId !== requestId)
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

        /** 删除发布任务 */
        deletePublishTask(taskId: string) {
          set(state => ({
            publishTasks: state.publishTasks.filter(task => task.id !== taskId),
          }))
        },

        /** 清空所有任务 */
        clearPublishTasks() {
          set({ publishTasks: [] })
        },

        /** 获取任务详情 */
        getPublishTask(taskId: string) {
          return get().publishTasks.find(task => task.id === taskId)
        },

        /** 更新任务列表配置 */
        updateTaskListConfig(config: Partial<PublishTaskListConfig>) {
          set(state => ({
            taskListConfig: { ...state.taskListConfig, ...config },
          }))
        },

        /**
         * 执行插件发布（封装完整的发布流程）
         * 支持并行发布多个平台，支持定时发布
         * @param params 发布参数
         * @returns Promise<void>
         */
        async executePluginPublish(params: ExecutePluginPublishParams): Promise<void> {
          const { items, platformTaskIdMap, publishTime, onProgress, onComplete } = params

          // 创建发布任务
          const platformTasks: any = items.map((item) => {
            const platform = item.account.type as PluginPlatformType
            const accountId = item.account.id
            const requestId = platformTaskIdMap.get(accountId) || ''

            // 构造 PublishParams
            const publishParams: PublishParams = {
              platform,
              accountId,
              requestId,
              type: item.params.video ? 'video' : 'image',
              title: item.params.title || '',
              desc: item.params.des || '',
              topics: item.params.topics || [],
            }

            // 添加视频或图片参数
            if (item.params.video) {
              publishParams.video = item.params.video.ossUrl
              if (item.params.video.cover?.ossUrl) {
                publishParams.cover = item.params.video.cover.ossUrl
              }
            } else if (item.params.images && item.params.images.length > 0) {
              publishParams.images = item.params.images
                .map(img => img.ossUrl)
                .filter((url): url is string => typeof url === 'string' && url.length > 0)
            }

            return {
              id: generateId(),
              platform,
              accountId,
              requestId,
              params: publishParams,
              status: PlatformTaskStatus.PENDING,
              progress: {
                stage: 'waiting',
                progress: 0,
                message: '等待开始...',
              },
              result: null,
              startTime: Date.now(),
              endTime: null,
              error: null,
            }
          })

          // 添加到发布任务列表
          const taskId = methods.addPublishTask({
            title: items[0]?.params.title || '插件发布任务',
            description: `发布到 ${items.length} 个平台`,
            platformTasks,
          })

          console.log('[PluginStore] Created publish task:', taskId)

          // 并行执行插件发布（不等待，同时发布多个平台）
          const publishPromises = items.map(async (item) => {
            const platform = item.account.type as PluginPlatformType
            const accountId = item.account.id
            // 获取该账号对应的 requestId（用于进度匹配）
            const requestId = platformTaskIdMap.get(accountId)

            if (!requestId) {
              console.error('未找到账号对应的 requestId:', accountId)
              return
            }

            // 更新任务状态为发布中
            methods.updatePlatformTaskByRequestId(requestId, {
              status: PlatformTaskStatus.PUBLISHING,
              startTime: Date.now(),
            })

            try {
              // 构建插件发布参数
              // 优先传递 File 对象，避免插件需要重新下载
              const publishParams: PublishParams = {
                platform,
                accountId, // 传入账号ID，用于区分同一平台的多个账号
                requestId, // 传入 requestId，插件回调时带回用于匹配
                type: item.params.video ? 'video' : 'image',
                title: item.params.title || '',
                desc: item.params.des || '',
                topics: item.params.topics || [],
              }

              // 如果有定时发布时间，则传入
              if (publishTime) {
                publishParams.scheduledTime = dayjs(publishTime).valueOf()
              }

              // 视频发布 - 优先传 file，没有 file 才传 URL
              if (item.params.video) {
                // 视频：优先传 file（转换 Blob 为 File），没有则传 ossUrl
                if (item.params.video.file) {
                  // 将 Blob 转换为 File
                  const videoFile = new File(
                    [item.params.video.file],
                    item.params.video.filename || 'video.mp4',
                    { type: item.params.video.file.type },
                  )
                  publishParams.video = videoFile
                }
                else if (item.params.video.ossUrl) {
                  publishParams.video = getOssUrl(item.params.video.ossUrl)
                }

                // 封面：优先传 file，没有则传 ossUrl
                if (item.params.video.cover?.file) {
                  publishParams.cover = item.params.video.cover.file
                }
                else if (item.params.video.cover?.ossUrl) {
                  publishParams.cover = getOssUrl(item.params.video.cover.ossUrl)
                }
              }
              // 图文发布 - 优先传 file，没有 file 才传 URL
              else if (item.params.images && item.params.images.length > 0) {
                publishParams.images = item.params.images.map((img) => {
                  // 优先传 file，没有则传 ossUrl
                  if (img.file) {
                    return img.file
                  }
                  return img.ossUrl ? getOssUrl(img.ossUrl) : ''
                }).filter(v => v !== '')
              }

              // 执行发布，通过 requestId 匹配进度
              const result = await methods.publish(publishParams, (progress) => {
                // 使用 requestId 精确更新进度
                methods.updatePlatformTaskByRequestId(requestId, {
                  progress,
                })

                // 触发外部进度回调
                onProgress?.({
                  ...progress,
                  accountId,
                  platform,
                  requestId,
                })
              })

              // 发布成功，更新任务状态
              methods.updatePlatformTaskByRequestId(requestId, {
                status: PlatformTaskStatus.COMPLETED,
                result: {
                  success: true,
                  workId: result.workId,
                  shareLink: result.shareLink,
                },
                endTime: Date.now(),
              })

              // 触发成功进度回调
              onProgress?.({
                stage: 'complete',
                progress: 100,
                message: '发布成功',
                timestamp: Date.now(),
                accountId,
                platform,
                requestId,
                data: {
                  workId: result.workId,
                  shareLink: result.shareLink,
                },
              })

              // 发布成功后，创建发布记录
              try {
                await apiCreatePublishRecord({
                  flowId: generateUUID(),
                  type: item.params.video ? 'video' : 'article',
                  title: item.params.title || '',
                  desc: item.params.des || '',
                  accountId: item.account.id,
                  accountType: item.account.type,
                  videoUrl: item.params.video?.ossUrl,
                  coverUrl: item.params.video?.cover?.ossUrl
                    || (item.params.images && item.params.images.length > 0
                      ? item.params.images[0].ossUrl
                      : undefined),
                  imgUrlList: item.params.images
                    ?.map(v => v.ossUrl)
                    .filter((url): url is string => url !== undefined) || [],
                  topics: item.params.topics || [],
                  status: 1, // 已发布
                  dataId: `${result.workId}`,
                  workLink: result.shareLink,
                  uid: item.account.uid,
                  // @ts-ignore
                  publishTime: publishTime || dayjs(Date.now()).utc().format(),
                })
              }
              catch (recordError) {
                console.error('创建发布记录失败:', recordError)
              }
            }
            catch (error) {
              // 发布失败
              const errorMessage = error instanceof Error ? error.message : '发布失败'

              methods.updatePlatformTaskByRequestId(requestId, {
                status: PlatformTaskStatus.ERROR,
                error: errorMessage,
                result: {
                  success: false,
                  failReason: errorMessage,
                },
                endTime: Date.now(),
              })

              // 触发失败进度回调
              onProgress?.({
                stage: 'error',
                progress: 0,
                message: errorMessage,
                timestamp: Date.now(),
                accountId,
                platform,
                requestId,
                data: {
                  error: error instanceof Error ? error : new Error(errorMessage),
                },
              })
            }
          })

          // 并行执行所有发布任务
          await Promise.all(publishPromises)

          // 发布完成后的回调
          onComplete?.()
        },
      }

      return methods
    },
  ),
)
