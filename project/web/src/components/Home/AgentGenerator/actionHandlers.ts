/**
 * AgentGenerator - Action 处理器
 * 使用策略模式处理不同的任务结果操作
 */

import { confirm } from '@/lib/confirm'
import { toast } from '@/lib/toast'
import { PubType } from '@/app/config/publishConfig'
import { MediaType } from '@/api/agent'
import { apiCreateMaterial, apiGetMaterialGroupList } from '@/api/material'
import { useAccountStore } from '@/store/account'
import { usePluginStore } from '@/store/plugin'
import { PluginStatus } from '@/store/plugin/types/baseTypes'
import type { PluginPublishItem } from '@/store/plugin/store'
import { driver } from 'driver.js'
import type { 
  ITaskData, 
  IActionContext, 
  IActionHandler,
  ActionType,
} from './agentStore.types'

// ============ 工具函数 ============

/**
 * 构建发布 URL 参数
 */
function buildPublishQueryParams(taskData: ITaskData): URLSearchParams {
  const params = new URLSearchParams()
  
  params.set('action', 'publish')
  params.set('aiGenerated', 'true')
  
  // 只添加非空值
  if (taskData.platform) params.set('platform', taskData.platform)
  if (taskData.accountId) params.set('accountId', taskData.accountId)
  if (taskData.taskId) params.set('taskId', taskData.taskId)
  if (taskData.title) params.set('title', taskData.title)
  if (taskData.description) params.set('description', taskData.description)
  if (taskData.tags && taskData.tags.length > 0) {
    params.set('tags', JSON.stringify(taskData.tags))
  }
  if (taskData.medias && taskData.medias.length > 0) {
    params.set('medias', JSON.stringify(taskData.medias))
  }
  
  return params
}

/**
 * 构建插件发布项
 */
function buildPluginPublishItem(taskData: ITaskData, account: any): PluginPublishItem {
  const medias = taskData.medias || []
  const hasVideo = medias.some((m) => m.type === 'VIDEO')
  const video = hasVideo ? medias.find((m) => m.type === 'VIDEO') : null
  
  const images = medias.filter((m) => m.type === 'IMAGE').map((m) => ({ 
    id: '',
    imgPath: m.url,
    ossUrl: m.url,
    size: 0,
    imgUrl: m.url,
    filename: '',
    width: 0,
    height: 0,
  }))

  return {
    account,
    params: {
      title: taskData.title || '',
      des: taskData.description || '',
      topics: taskData.tags || [],
      video: (video ? {
        size: 0,
        videoUrl: video.url,
        ossUrl: video.url,
        filename: '',
        width: 0,
        height: 0,
        duration: 0,
        cover: {
          id: '',
          imgPath: video.coverUrl || video.thumbUrl || '',
          ossUrl: video.coverUrl || video.thumbUrl,
          size: 0,
          imgUrl: video.coverUrl || video.thumbUrl || '',
          filename: '',
          width: 0,
          height: 0,
        },
      } : undefined) as any,
      images: images.length > 0 ? images : undefined,
      option: {},
    },
  }
}

// ============ Action Handlers ============

/**
 * 导航到发布页面 - 处理插件平台（xhs, douyin）
 */
const navigateToPublishPluginHandler: IActionHandler = {
  type: 'navigateToPublish',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' 
      && taskData.action === 'navigateToPublish'
      && (taskData.platform === 'xhs' || taskData.platform === 'douyin')
  },
  
  async execute(taskData, context) {
    const { t } = context
    const pluginStatus = usePluginStore.getState().status
    const isPluginReady = pluginStatus === PluginStatus.READY
    
    if (!isPluginReady) {
      // 插件未准备就绪，显示引导
      toast.warning(t('plugin.platformNeedsPlugin' as any))
      
      setTimeout(() => {
        const pluginButton = document.querySelector('[data-driver-target="plugin-button"]') as HTMLElement
        if (!pluginButton) {
          console.warn('[ActionHandler] Plugin button not found')
          return
        }

        const driverObj = driver({
          showProgress: false,
          showButtons: ['next'],
          nextBtnText: t('aiGeneration.gotIt' as any),
          doneBtnText: t('aiGeneration.gotIt' as any),
          popoverOffset: 10,
          stagePadding: 4,
          stageRadius: 12,
          allowClose: true,
          smoothScroll: true,
          steps: [
            {
              element: '[data-driver-target="plugin-button"]',
              popover: {
                title: t('plugin.authorizePluginTitle' as any),
                description: t('plugin.authorizePluginDescription' as any),
                side: 'bottom',
                align: 'start',
                onPopoverRender: () => {
                  setTimeout(() => {
                    const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                    const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
                    const btn = nextBtn || doneBtn
                    if (btn) {
                      btn.textContent = t('aiGeneration.gotIt' as any)
                      const handleClick = (e: MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        driverObj.destroy()
                        btn.removeEventListener('click', handleClick)
                      }
                      btn.addEventListener('click', handleClick)
                    }
                  }, 50)
                },
              },
            },
          ],
          onNextClick: () => {
            driverObj.destroy()
            return false
          },
        })

        driverObj.drive()
      }, 1500)
      return
    }
    
    // 插件已就绪，执行发布
    try {
      const accountGroupList = useAccountStore.getState().accountGroupList
      const allAccounts = accountGroupList.reduce<any[]>((acc, group) => {
        return [...acc, ...group.children]
      }, [])
      
      // 根据 accountId 或 platform 查找目标账号
      let targetAccounts: any[] = []
      if (taskData.accountId) {
        const targetAccount = allAccounts.find(account => account.id === taskData.accountId)
        if (targetAccount) {
          targetAccounts = [targetAccount]
        } else {
          console.warn(`[ActionHandler] Account not found: ${taskData.accountId}`)
        }
      } else {
        targetAccounts = allAccounts.filter(account => account.type === taskData.platform)
      }
      
      if (targetAccounts.length === 0) {
        console.warn(`[ActionHandler] No accounts found for platform: ${taskData.platform}`)
        toast.warning(t('aiGeneration.noAccountFound' as any) || '未找到可发布的账号')
        return
      }
      
      // 构建发布项
      const allPluginPublishItems: PluginPublishItem[] = []
      const platformTaskIdMap = new Map<string, string>()
      
      targetAccounts.forEach(account => {
        const publishItem = buildPluginPublishItem(taskData, account)
        // @ts-ignore
        allPluginPublishItems.push(publishItem)
        
        const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        platformTaskIdMap.set(account.id, requestId)
      })
      
      console.log(`[ActionHandler] Total plugin publish items: ${allPluginPublishItems.length}`)
      
      if (allPluginPublishItems.length > 0) {
        usePluginStore.getState().executePluginPublish({
          items: allPluginPublishItems,
          platformTaskIdMap,
          onProgress: (event) => {
            const { stage, progress, message: progressMessage, accountId, platform } = event
            console.log(`[${platform}] 账号 ${accountId}: ${stage} - ${progress}% - ${progressMessage}`)

            if (stage === 'error') {
              toast.error(progressMessage)
            }
          },
          onComplete: () => {
            toast.info(t('plugin.publishTaskSubmitted' as any))
          },
        })
      }
    } catch (error: any) {
      console.error('[ActionHandler] Plugin publish error:', error)
      toast.error(`${t('plugin.publishFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
    }
  },
}

/**
 * 导航到发布页面 - 处理其他平台（快手等）
 */
const navigateToPublishOtherHandler: IActionHandler = {
  type: 'navigateToPublish',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' 
      && taskData.action === 'navigateToPublish'
      && taskData.platform !== 'xhs' 
      && taskData.platform !== 'douyin'
  },
  
  async execute(taskData, context) {
    const { router, lng } = context
    const queryParams = buildPublishQueryParams(taskData)
    
    console.log('[ActionHandler] Navigating to /accounts for publishing, platform:', taskData.platform)
    
    setTimeout(() => {
      router.push(`/${lng}/accounts?${queryParams.toString()}`)
    }, 1500)
  },
}

/**
 * 导航到草稿箱
 */
const navigateToDraftHandler: IActionHandler = {
  type: 'navigateToDraft',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' && taskData.action === 'navigateToDraft'
  },
  
  async execute(_taskData, context) {
    const { router, lng } = context
    
    setTimeout(() => {
      router.push(`/${lng}/cgmaterial`)
    }, 1500)
  },
}

/**
 * 保存草稿
 */
const saveDraftHandler: IActionHandler = {
  type: 'saveDraft',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' && taskData.action === 'saveDraft'
  },
  
  async execute(taskData, context) {
    const { router, lng, t } = context
    
    try {
      // 转换 medias 格式
      const medias = taskData.medias || []
      const materialMediaList = medias.map((media) => {
        const pubType = media.type === MediaType.Video 
          ? PubType.VIDEO 
          : PubType.ImageText
        return {
          url: media.url,
          type: pubType,
          content: media.coverUrl || undefined,
        }
      })

      // 确定封面URL
      const coverUrl = medias.find((m) => m.coverUrl)?.coverUrl 
        || medias.find((m) => m.type === 'IMAGE')?.url
        || undefined

      // 获取分组列表
      const groupListRes = await apiGetMaterialGroupList(1, 100)
      const groups = groupListRes?.data?.list || []

      if (groups.length === 0) {
        toast.warning(t('aiGeneration.noDraftGroupFound' as any))
        return
      }

      // 根据 medias 类型选择默认分组
      const hasVideo = medias.some((m) => m.type === 'VIDEO')
      const targetGroupType = hasVideo ? PubType.VIDEO : PubType.ImageText
      const defaultGroup = groups.find((g: any) => g.type === targetGroupType) || groups[0]
      const finalGroupId = defaultGroup._id || defaultGroup.id

      if (!finalGroupId) {
        toast.warning(t('aiGeneration.noDraftGroup' as any))
        return
      }

      // 创建草稿
      const createResult = await apiCreateMaterial({
        groupId: finalGroupId,
        coverUrl,
        mediaList: materialMediaList,
        title: taskData.title || '',
        desc: taskData.description || '',
      })

      if (createResult) {
        toast.success(t('aiGeneration.saveDraftSuccess' as any))
        setTimeout(() => {
          router.push(`/${lng}/cgmaterial`)
        }, 1500)
      } else {
        toast.error(t('aiGeneration.saveDraftFailed' as any))
      }
    } catch (error: any) {
      console.error('[ActionHandler] Save draft error:', error)
      toast.error(`${t('aiGeneration.saveDraftFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
    }
  },
}

/**
 * 更新频道授权
 */
const updateChannelHandler: IActionHandler = {
  type: 'updateChannel',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' && taskData.action === 'updateChannel'
  },
  
  async execute(taskData, context) {
    const { router, lng, t } = context
    const platform = taskData.platform
    
    toast.warning(t('aiGeneration.channelAuthExpired' as any))
    
    confirm({
      title: t('aiGeneration.channelAuthExpiredTitle' as any),
      content: t('aiGeneration.channelAuthExpiredContent' as any),
      okText: t('aiGeneration.reauthorize' as any),
      cancelText: t('aiGeneration.cancel' as any),
      onOk: () => {
        router.push(`/${lng}/accounts?updateChannel=${platform}`)
      },
    })
  },
}

/**
 * 登录频道
 */
const loginChannelHandler: IActionHandler = {
  type: 'loginChannel',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' && taskData.action === 'loginChannel'
  },
  
  async execute(taskData, context) {
    const { router, lng, t } = context
    const platform = taskData.platform
    
    toast.info(t('aiGeneration.needLoginChannel' as any))
    
    confirm({
      title: t('aiGeneration.needLogin' as any),
      content: t('aiGeneration.pleaseLoginChannel' as any),
      okText: t('aiGeneration.goLogin' as any),
      cancelText: t('aiGeneration.cancel' as any),
      onOk: () => {
        router.push(`/${lng}/accounts?loginChannel=${platform}`)
      },
    })
  },
}

/**
 * 默认发布处理（无 action 时）
 */
const defaultPublishHandler: IActionHandler = {
  type: 'navigateToPublish',
  
  canHandle: (taskData) => {
    return taskData.type === 'fullContent' && !taskData.action
  },
  
  async execute(taskData, context) {
    const { router, lng } = context
    const queryParams = buildPublishQueryParams(taskData)
    
    setTimeout(() => {
      router.push(`/${lng}/accounts?${queryParams.toString()}`)
    }, 1500)
  },
}

// ============ Action Registry ============

/** 所有注册的 Action Handlers */
const actionHandlers: IActionHandler[] = [
  navigateToPublishPluginHandler,
  navigateToPublishOtherHandler,
  navigateToDraftHandler,
  saveDraftHandler,
  updateChannelHandler,
  loginChannelHandler,
  defaultPublishHandler,
]

/**
 * Action 注册表
 * 使用策略模式管理和执行不同的 Action
 */
export const ActionRegistry = {
  /**
   * 注册新的 Action Handler
   * @param handler Action Handler
   */
  register(handler: IActionHandler): void {
    // 添加到列表开头，确保新注册的优先匹配
    actionHandlers.unshift(handler)
  },

  /**
   * 执行 Action
   * @param taskData 任务数据
   * @param context Action 上下文
   * @returns 是否成功执行
   */
  async execute(taskData: ITaskData, context: IActionContext): Promise<boolean> {
    // 跳过纯媒体类型
    if (taskData.type === 'imageOnly' || taskData.type === 'videoOnly' || taskData.type === 'mediaOnly') {
      console.log('[ActionRegistry] Skipping media-only result:', taskData.platform)
      return false
    }

    // 查找匹配的 Handler
    const handler = actionHandlers.find(h => h.canHandle(taskData))
    
    if (handler) {
      console.log(`[ActionRegistry] Executing handler: ${handler.type} for platform: ${taskData.platform}`)
      await handler.execute(taskData, context)
      return true
    }
    
    console.warn('[ActionRegistry] No handler found for task:', taskData)
    return false
  },

  /**
   * 批量执行 Actions（处理多个任务结果）
   * @param taskDataList 任务数据列表
   * @param context Action 上下文
   */
  async executeBatch(taskDataList: ITaskData[], context: IActionContext): Promise<void> {
    // 分离插件平台任务和其他任务
    const pluginTasks: ITaskData[] = []
    const otherTasks: ITaskData[] = []

    taskDataList.forEach(taskData => {
      // 跳过纯媒体类型
      if (taskData.type === 'imageOnly' || taskData.type === 'videoOnly' || taskData.type === 'mediaOnly') {
        return
      }

      if (taskData.type === 'fullContent' && taskData.action === 'navigateToPublish') {
        if (taskData.platform === 'xhs' || taskData.platform === 'douyin') {
          pluginTasks.push(taskData)
        } else {
          otherTasks.push(taskData)
        }
      } else {
        otherTasks.push(taskData)
      }
    })

    console.log(`[ActionRegistry] Plugin tasks: ${pluginTasks.length}, Other tasks: ${otherTasks.length}`)

    // 批量处理插件平台任务
    if (pluginTasks.length > 0) {
      await this.executePluginBatch(pluginTasks, context)
    }

    // 逐个处理其他任务
    for (const taskData of otherTasks) {
      await this.execute(taskData, context)
    }
  },

  /**
   * 批量执行插件平台发布
   * @param pluginTasks 插件平台任务列表
   * @param context Action 上下文
   */
  async executePluginBatch(pluginTasks: ITaskData[], context: IActionContext): Promise<void> {
    const { t } = context
    const pluginStatus = usePluginStore.getState().status
    const isPluginReady = pluginStatus === PluginStatus.READY

    if (!isPluginReady) {
      toast.warning(t('plugin.platformNeedsPlugin' as any))
      // 显示插件引导（与单个任务相同逻辑）
      setTimeout(() => {
        const pluginButton = document.querySelector('[data-driver-target="plugin-button"]') as HTMLElement
        if (!pluginButton) return

        const driverObj = driver({
          showProgress: false,
          showButtons: ['next'],
          nextBtnText: t('aiGeneration.gotIt' as any),
          doneBtnText: t('aiGeneration.gotIt' as any),
          popoverOffset: 10,
          stagePadding: 4,
          stageRadius: 12,
          allowClose: true,
          smoothScroll: true,
          steps: [
            {
              element: '[data-driver-target="plugin-button"]',
              popover: {
                title: t('plugin.authorizePluginTitle' as any),
                description: t('plugin.authorizePluginDescription' as any),
                side: 'bottom',
                align: 'start',
              },
            },
          ],
          onNextClick: () => {
            driverObj.destroy()
            return false
          },
        })

        driverObj.drive()
      }, 1500)
      return
    }

    try {
      const accountGroupList = useAccountStore.getState().accountGroupList
      const allAccounts = accountGroupList.reduce<any[]>((acc, group) => {
        return [...acc, ...group.children]
      }, [])

      const allPluginPublishItems: PluginPublishItem[] = []
      const platformTaskIdMap = new Map<string, string>()

      pluginTasks.forEach(taskData => {
        let targetAccounts: any[] = []
        if (taskData.accountId) {
          const targetAccount = allAccounts.find(account => account.id === taskData.accountId)
          if (targetAccount) {
            targetAccounts = [targetAccount]
          }
        } else {
          targetAccounts = allAccounts.filter(account => account.type === taskData.platform)
        }

        if (targetAccounts.length === 0) {
          console.warn(`[ActionRegistry] No accounts found for platform: ${taskData.platform}`)
          return
        }

        targetAccounts.forEach(account => {
          const publishItem = buildPluginPublishItem(taskData, account)
          // @ts-ignore
          allPluginPublishItems.push(publishItem)

          const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
          platformTaskIdMap.set(account.id, requestId)
        })
      })

      console.log(`[ActionRegistry] Total plugin publish items: ${allPluginPublishItems.length}`)

      if (allPluginPublishItems.length > 0) {
        usePluginStore.getState().executePluginPublish({
          items: allPluginPublishItems,
          platformTaskIdMap,
          onProgress: (event) => {
            const { stage, progress, message: progressMessage, accountId, platform } = event
            console.log(`[${platform}] 账号 ${accountId}: ${stage} - ${progress}% - ${progressMessage}`)

            if (stage === 'error') {
              toast.error(progressMessage)
            }
          },
          onComplete: () => {
            toast.info(t('plugin.publishTaskSubmitted' as any))
          },
        })
      } else {
        toast.warning(t('aiGeneration.noAccountFound' as any) || '未找到可发布的账号')
      }
    } catch (error: any) {
      console.error('[ActionRegistry] Plugin batch publish error:', error)
      toast.error(`${t('plugin.publishFailed' as any)}: ${error.message || t('aiGeneration.unknownError' as any)}`)
    }
  },
}

export default ActionRegistry

