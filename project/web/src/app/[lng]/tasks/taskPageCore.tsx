/**
 * TaskPageCore - 任务中心核心页面
 * 任务接取、发布、提交的核心功能页面
 */

'use client'

import type {
  TaskOpportunity,
  UserTask,
} from '@/api/task'
import type { SocialAccount } from '@/api/types/account.type'
import type { PlatType } from '@/app/config/platConfig'
import { ClockCircleOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Spin } from '@/components/ui/spin'
import { Empty } from '@/components/ui/empty'
import { Card } from '@/components/ui/card'
import { Steps } from '@/components/ui/steps'
import { List } from '@/components/ui/list'
import { Pagination } from '@/components/ui/pagination'
import { Radio } from '@/components/ui/radio'
import { Row, Col } from '@/components/ui/grid'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { getAccountListApi } from '@/api/account'
import { apiGetMaterialList } from '@/api/material'
import { acceptTask, getTaskDetail, submitTask } from '@/api/notification'
import { apiCreatePublish } from '@/api/plat/publish'
import {
  apiAcceptTask,
  apiGetTaskOpportunityList,
  apiGetUserTaskDetail,
  apiGetUserTaskList,
  apiMarkTaskAsViewed,
  apiSubmitTask,
} from '@/api/task'
import { getDays, getUtcDays } from '@/app/[lng]/accounts/components/CalendarTiming/calendarTiming.utils'
import { getAppDownloadConfig, getTasksRequiringApp } from '@/app/config/appDownloadConfig'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import DownloadAppModal from '@/components/common/DownloadAppModal'
import { useUserStore } from '@/store/user'
import { generateUUID } from '@/utils'
import { getOssUrl } from '@/utils/oss'
import styles from './taskPageCore.module.scss'
import PublishDialog from '@/components/PublishDialog'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'

export default function TaskPageCore() {
  const { t } = useTransClient('task' as any)
  // use only task namespace translator `t` to avoid cross-namespace missing translations
  const token = useUserStore(state => state.token)
  const router = useRouter()
  const params = useParams()
  const lng = params.lng as string

  // Show login prompt if not logged in
  if (!token) {
    return (
      <div className={styles.taskPage}>
        <div className={styles.header}>
          <h1>{t('title')}</h1>
          <p>{t('messages.pleaseLoginFirst')}</p>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty description={t('messages.pleaseLoginFirst')} />
        </div>
      </div>
    )
  }

  // State management
  const [activeTab, setActiveTab] = useState('pending') // pending: Pending tasks, accepted: Accepted tasks
  const [pendingTasks, setPendingTasks] = useState<TaskOpportunity[]>([])
  const [acceptedTasks, setAcceptedTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(false)

  // Pagination state
  const [pendingPagination, setPendingPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  })
  const [acceptedPagination, setAcceptedPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  })
  const [selectedTask, setSelectedTask] = useState<TaskOpportunity | null>(null)
  const [submitModalVisible, setSubmitModalVisible] = useState(false)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null)

  // Additional states
  const [accountList, setAccountList] = useState<SocialAccount[]>([])
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false)
  const [taskDetail, setTaskDetail] = useState<any>(null)
  const [taskDetailLoading, setTaskDetailLoading] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Accepted task detail modal state
  const [acceptedTaskDetailModalVisible, setAcceptedTaskDetailModalVisible] = useState(false)
  const [acceptedTaskDetail, setAcceptedTaskDetail] = useState<any>(null)
  const [acceptedTaskDetailLoading, setAcceptedTaskDetailLoading] = useState(false)

  // Media preview modal state
  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'video' | 'image'
    url: string
    title?: string
  } | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)

  // Task progress modal state
  const [taskProgressVisible, setTaskProgressVisible] = useState(false)
  const [taskProgress, setTaskProgress] = useState({
    currentStep: 0,
    steps: [
      { title: t('acceptingTask' as any), status: 'processing' },
      { title: t('publishingTask' as any), status: 'wait' },
      { title: t('submittingTask' as any), status: 'wait' },
      { title: t('taskCompleted' as any), status: 'wait' },
    ],
  })

  // 下载App弹窗状态 - 暂时注释
  const [downloadAppVisible, setDownloadAppVisible] = useState(false)
  const [downloadAppConfig, setDownloadAppConfig] = useState({
    platform: '',
    appName: '',
    downloadUrl: '',
    qrCodeUrl: '' as string | undefined,
  })

  // 账号选择弹窗状态
  const [accountSelectVisible, setAccountSelectVisible] = useState(false)
  const [availableAccounts, setAvailableAccounts] = useState<SocialAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null)

  // 素材列表状态
  const [materialList, setMaterialList] = useState<any[]>([])
  const [materialLoading, setMaterialLoading] = useState(false)
  const [materialPagination, setMaterialPagination] = useState({
    current: 1,
    pageSize: 9,
    total: 0,
  })

  // 推荐草稿选择状态
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null) // 选中的推荐草稿
  const [requiredAccountTypes, setRequiredAccountTypes] = useState<string[]>([])

  // Accepted task detail material list state
  const [acceptedTaskMaterialList, setAcceptedTaskMaterialList] = useState<any[]>([])
  const [acceptedTaskMaterialLoading, setAcceptedTaskMaterialLoading] = useState(false)
  // Publish dialog state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishDefaultAccountId, setPublishDefaultAccountId] = useState<string | undefined>(undefined)
  const [pendingUserTaskIdForPublish, setPendingUserTaskIdForPublish] = useState<string | undefined>(undefined)
  const [pendingTaskMaterialIdForPublish, setPendingTaskMaterialIdForPublish] = useState<string | undefined>(undefined)
  const [pendingTaskForPublish, setPendingTaskForPublish] = useState<any | null>(null)

  // Fetch pending tasks list
  const fetchPendingTasks = async (page: number = 1, pageSize: number = 15) => {
    if (!token)
      return

    try {
      setLoading(true)
      const response = await apiGetTaskOpportunityList({ page, pageSize })
      if (response && response.data) {
        setPendingTasks(response.data.list || [])
        setPendingPagination(prev => ({
          ...prev,
          current: page,
          total: (response.data as any).total || 0,
        }))
      }
      else {
        setPendingTasks([])
      }
    }
    catch (error) {
      console.error('Failed to get pending tasks:', error)
      toast.error(t('messages.getPendingTasksFailed'))
      setPendingTasks([])
    }
    finally {
      setLoading(false)
    }
  }

  // Fetch accepted tasks list
  const fetchAcceptedTasks = async (page: number = 1, pageSize: number = 15) => {
    if (!token)
      return

    try {
      setLoading(true)
      const response = await apiGetUserTaskList({ page, pageSize })
      if (response && response.data) {
        setAcceptedTasks(response.data.list || [])
        setAcceptedPagination(prev => ({
          ...prev,
          current: page,
          total: (response.data as any).total || 0,
        }))
      }
      else {
        setAcceptedTasks([])
      }
    }
    catch (error) {
      console.error('Failed to get accepted tasks:', error)
      toast.error(t('messages.getAcceptedTasksFailed'))
      setAcceptedTasks([])
    }
    finally {
      setLoading(false)
    }
  }

  // Fetch account list
  const fetchAccountList = async () => {
    if (!token) {
      setAccountList([])
      return
    }

    try {
      const response = await getAccountListApi()
      if (response && response.data) {
        setAccountList(response.data || [])
      }
    }
    catch (error) {
      console.error('Failed to get account list:', error)
    }
  }

  // 接受任务
  const handleAcceptTask = async (task: any) => {
    // 打开任务详情让用户选择素材并完成接取/发布流程
    await handleViewTaskDetail(task.id)

    // TODO: 添加平台限制检查
    // if (!task.accountTypes || task.accountTypes.length === 0) {
    //   // 没有账号类型限制，直接接取任务
    //   await doAcceptTask(task);
    //   return;
    // }

    // // Check platforms that require App operation
    // const appRequiredPlatforms = getTasksRequiringApp(task.accountTypes);

    // if (appRequiredPlatforms.length > 0) {
    //   // 有需要App操作的平台，显示第一个平台的下载提示
    //   const firstPlatform = appRequiredPlatforms[0];
    //   const config = getAppDownloadConfig(firstPlatform);

    //   if (config) {
    //     setDownloadAppConfig({
    //       platform: config.platform,
    //       appName: config.appName,
    //       downloadUrl: config.downloadUrl,
    //       qrCodeUrl: config.qrCodeUrl
    //     });
    //     setDownloadAppVisible(true);
    //     return;
    //   }
    // }

    // // Other task types can be accepted normally
    // await doAcceptTask(task);
  }

  // 执行接受任务
  const doAcceptTask = async (task: TaskOpportunity) => {
    try {
      const response = await apiAcceptTask(task.id)
      if (response && response.code === 0) {
        toast.success(t('messages.acceptTaskSuccess'))
        // 刷新任务列表
        fetchPendingTasks()
        fetchAcceptedTasks()
        // 切换到已接受任务标签
        setActiveTab('accepted')
      }
    }
    catch (error) {
      toast.error(t('messages.acceptTaskFailed'))
      console.error('接受任务失败:', error)
    }
  }

  // 获取平台显示名称
  const getPlatformName = (type: string) => {
    const platformNames: Record<string, string> = {
      tiktok: t('platforms.tiktok' as any),
      youtube: t('platforms.youtube' as any),
      twitter: t('platforms.twitter' as any),
      bilibili: t('platforms.bilibili' as any),
      KWAI: t('platforms.KWAI' as any),
      douyin: t('platforms.douyin' as any),
      xhs: t('platforms.xhs' as any),
      wxSph: t('platforms.wxSph' as any),
      wxGzh: t('platforms.wxGzh' as any),
      facebook: t('platforms.facebook' as any),
      instagram: t('platforms.instagram' as any),
      threads: t('platforms.threads' as any),
      pinterest: t('platforms.pinterest' as any),
    }
    return platformNames[type] || type
  }

  // 获取任务类型显示名称
  const getTaskTypeName = (type: string) => {
    const taskTypeNames: Record<string, string> = {
      video: t('taskTypes.video' as any),
      article: t('taskTypes.article' as any),
      article2: t('taskTypes.article2' as any),
    }
    return taskTypeNames[type] || type
  }

  // 格式化时间（相对时间，如"3小时前"）
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1)
      return t('time.justNow' as any)
    if (minutes < 60)
      return t('time.minutesAgo' as any, { minutes })
    if (hours < 24)
      return t('time.hoursAgo' as any, { hours })
    if (days < 7)
      return t('time.daysAgo' as any, { days })
    return date.toLocaleDateString()
  }

  // 格式化绝对时间（显示具体日期时间）
  const formatAbsoluteTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    // 如果是未来时间，显示剩余时间
    if (diff > 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 60)
        return t('time.minutesLater' as any, { minutes })
      if (hours < 24)
        return t('time.hoursLater' as any, { hours })
      if (days < 7)
        return t('time.daysLater' as any, { days })
    }

    // 显示具体日期时间
    return date.toLocaleString(lng === 'zh-CN' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get task status tag
  const getTaskStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string, text: string }> = {
      pending: { color: 'green', text: t('taskStatus.pending' as any) }, // pending means completed
      doing: { color: 'orange', text: t('taskStatus.doing' as any) }, // doing means pending
      accepted: { color: 'blue', text: t('taskStatus.accepted' as any) },
      completed: { color: 'green', text: t('taskStatus.completed' as any) },
      rejected: { color: 'red', text: t('taskStatus.rejected' as any) },
    }
    return statusMap[status] || { color: 'default', text: status }
  }

  // 将 antd Tag 的 color 转换为 Badge 的样式类
  const getBadgeClassName = (color?: string) => {
    const colorMap: Record<string, string> = {
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colorMap[color || 'default'] || colorMap.default
  }

  // 根据accountId获取账号信息
  const getAccountById = (accountId: string): SocialAccount | null => {
    return accountList.find(account => account.id === accountId) || null
  }

  // 获取符合条件的账号
  const getAvailableAccounts = (accountTypes: string[]): SocialAccount[] => {
    if (!accountTypes || accountTypes.length === 0) {
      return accountList
    }
    return accountList.filter(account => accountTypes.includes(account.type))
  }

  // 处理任务操作（接受任务）
  const handleTaskAction = (task: any) => {
    // 首先检查任务支持的所有平台是否都需要App操作
    const taskPlatforms = task.accountTypes || []
    const appRequiredPlatforms = getTasksRequiringApp(taskPlatforms)

    // 如果所有平台都需要App操作，直接显示下载App提示
    if (appRequiredPlatforms.length > 0 && appRequiredPlatforms.length === taskPlatforms.length) {
      const firstPlatform = appRequiredPlatforms[0]
      const config = getAppDownloadConfig(firstPlatform)

      if (config) {
        setDownloadAppConfig({
          platform: config.platform,
          appName: config.appName,
          downloadUrl: config.downloadUrl,
          qrCodeUrl: config.qrCodeUrl,
        })
        setDownloadAppVisible(true)
        return
      }
    }

    // 如果任务指定了账号，使用指定账号的逻辑
    if (task.accountId) {
      const publishAccount = getAccountById(task.accountId)
      if (publishAccount) {
        // 检查发布账号的平台是否需要App操作
        const appRequiredPlatforms = getTasksRequiringApp([publishAccount.type])

        if (appRequiredPlatforms.length > 0) {
          // 有需要App操作的平台，显示第一个平台的下载提示
          const firstPlatform = appRequiredPlatforms[0]
          const config = getAppDownloadConfig(firstPlatform)

          if (config) {
            setDownloadAppConfig({
              platform: config.platform,
              appName: config.appName,
              downloadUrl: config.downloadUrl,
              qrCodeUrl: config.qrCodeUrl,
            })
            setDownloadAppVisible(true)
            return
          }
        }

        // 直接使用指定账号接受任务
        handleAcceptTaskFromDetail(task, publishAccount)
        return
      }
    }

    // 如果没有指定账号，需要用户选择账号
    const availableAccounts = getAvailableAccounts(task.accountTypes || [])

    if (availableAccounts.length === 0) {
      // 没有符合条件的账号，跳转到账户界面并弹出授权界面
      setRequiredAccountTypes(task.accountTypes || [])
      setTaskDetailModalVisible(false) // 关闭任务详情弹窗
      // 关闭消息通知弹窗
      toast.info(t('accountSelect.redirectingToAccounts' as any))

      // 构建跳转URL，包含需要的平台类型参数
      const accountTypes = task.accountTypes || []
      const platformParam = accountTypes.length > 0 ? accountTypes[0] : undefined
      const accountsUrl = platformParam
        ? `/${lng}/accounts?platform=${platformParam}`
        : `/${lng}/accounts`

      router.push(accountsUrl) // 跳转到账户界面并自动打开添加账号弹窗
      return
    }

    if (availableAccounts.length === 1) {
      // 只有一个符合条件的账号，直接使用
      const account = availableAccounts[0]

      // 检查是否需要App操作
      const appRequiredPlatforms = getTasksRequiringApp([account.type])
      if (appRequiredPlatforms.length > 0) {
        const firstPlatform = appRequiredPlatforms[0]
        const config = getAppDownloadConfig(firstPlatform)

        if (config) {
          setDownloadAppConfig({
            platform: config.platform,
            appName: config.appName,
            downloadUrl: config.downloadUrl,
            qrCodeUrl: config.qrCodeUrl,
          })
          setDownloadAppVisible(true)
          return
        }
      }

      // 直接使用这个账号接受任务
      handleAcceptTaskFromDetail(task, account)
      return
    }

    // 多个符合条件的账号，显示选择弹窗
    setAvailableAccounts(availableAccounts)
    setAccountSelectVisible(true)
  }

  // 处理账号选择
  const handleAccountSelect = (account: SocialAccount) => {
    setSelectedAccount(account)
    setAccountSelectVisible(false)

    // 检查是否需要App操作
    const appRequiredPlatforms = getTasksRequiringApp([account.type])
    if (appRequiredPlatforms.length > 0) {
      const firstPlatform = appRequiredPlatforms[0]
      const config = getAppDownloadConfig(firstPlatform)

      if (config) {
        setDownloadAppConfig({
          platform: config.platform,
          appName: config.appName,
          downloadUrl: config.downloadUrl,
          qrCodeUrl: config.qrCodeUrl,
        })
        setDownloadAppVisible(true)
        return
      }
    }

    // 使用选择的账号接受任务
    if (taskDetail) {
      handleAcceptTaskFromDetail(taskDetail, account)
    }
  }

  // 检查是否有新添加的符合条件账号
  const checkForNewAccounts = () => {
    if (requiredAccountTypes.length > 0 && taskDetail) {
      const newAvailableAccounts = getAvailableAccounts(requiredAccountTypes)

      if (newAvailableAccounts.length > 0) {
        // 有新账号了，清除需求状态
        setRequiredAccountTypes([])

        if (newAvailableAccounts.length === 1) {
          // 只有一个新账号，直接使用
          const account = newAvailableAccounts[0]

          // 检查是否需要App操作
          const appRequiredPlatforms = getTasksRequiringApp([account.type])
          if (appRequiredPlatforms.length > 0) {
            const firstPlatform = appRequiredPlatforms[0]
            const config = getAppDownloadConfig(firstPlatform)

            if (config) {
              setDownloadAppConfig({
                platform: config.platform,
                appName: config.appName,
                downloadUrl: config.downloadUrl,
                qrCodeUrl: config.qrCodeUrl,
              })
              setDownloadAppVisible(true)
              return
            }
          }

          // 直接使用这个账号接受任务
          handleAcceptTaskFromDetail(taskDetail, account)
        }
        else {
          // 多个新账号，显示选择弹窗
          setAvailableAccounts(newAvailableAccounts)
          setAccountSelectVisible(true)
        }
      }
    }
  }

  // 获取平台图标
  const getPlatformIcon = (accountType: string) => {
    const platInfo = AccountPlatInfoMap.get(accountType as PlatType)
    return platInfo?.icon || ''
  }

  // 获取素材列表
  const fetchMaterialList = async (groupId: string, page: number = 1, pageSize: number = 9) => {
    try {
      setMaterialLoading(true)
      const response: any = await apiGetMaterialList(groupId, page, pageSize)
      if (response && response.data && response.code === 0) {
        setMaterialList(response.data.list || [])
        setMaterialPagination({
          current: page,
          pageSize,
          total: response.data.total || 0,
        })
        // 默认选中第一个素材
        if (response.data.list && response.data.list.length > 0 && !selectedMaterial) {
          setSelectedMaterial(response.data.list[0])
        }
      }
    }
    catch (error) {
      console.error('Failed to get material list:', error)
      toast.error('Failed to get material list')
    }
    finally {
      setMaterialLoading(false)
    }
  }

  // 查看任务详情
  const handleViewTaskDetail = async (opportunityId: string) => {
    try {
      setTaskDetailLoading(true)
      const response: any = await getTaskDetail(opportunityId)
      if (response && response.data && response.code === 0) {
        setTaskDetail(response.data)
        setTaskDetailModalVisible(true)

        // 重置推荐草稿选择状态
        setSelectedMaterial(null)

        // 如果有 materialGroupId，获取素材列表
        if (response.data.materialGroupId) {
          fetchMaterialList(response.data.materialGroupId, 1, 9)
        }

        // 标记任务为已读
        try {
          await apiMarkTaskAsViewed(opportunityId)
          // 刷新任务列表以更新未读状态
          fetchPendingTasks(pendingPagination.current, pendingPagination.pageSize)
        }
        catch (error) {
          console.error('标记任务为已读失败:', error)
          // 标记失败不影响主流程，不显示错误提示
        }
      }
      else {
        toast.error(t('messages.getTaskDetailFailed'))
      }
    }
    catch (error) {
      toast.error(t('messages.getTaskDetailFailed'))
      console.error('获取任务详情失败:', error)
    }
    finally {
      setTaskDetailLoading(false)
    }
  }

  // View accepted task detail
  const handleViewAcceptedTaskDetail = async (taskId: string) => {
    try {
      setAcceptedTaskDetailLoading(true)
      setCurrentTaskId(taskId)
      const response: any = await apiGetUserTaskDetail(taskId)
      if (response && response.data && response.code === 0) {
        setAcceptedTaskDetail(response.data)
        setAcceptedTaskDetailModalVisible(true)

        // If materialGroupId exists, fetch material list
        if (response.data.task?.materialGroupId) {
          fetchAcceptedTaskMaterialList(response.data.task.materialGroupId)
        }
      }
      else {
        toast.error(t('messages.getTaskDetailFailed'))
      }
    }
    catch (error) {
      toast.error(t('messages.getTaskDetailFailed'))
      console.error('Failed to get task detail:', error)
    }
    finally {
      setAcceptedTaskDetailLoading(false)
    }
  }

  // Fetch material list for accepted task detail
  const fetchAcceptedTaskMaterialList = async (groupId: string) => {
    try {
      setAcceptedTaskMaterialLoading(true)
      const response: any = await apiGetMaterialList(groupId, 1, 10)
      if (response && response.data && response.code === 0) {
        setAcceptedTaskMaterialList(response.data.list || [])
      }
    }
    catch (error) {
      console.error('Failed to get material list:', error)
    }
    finally {
      setAcceptedTaskMaterialLoading(false)
    }
  }

  // 从任务详情接受任务
  const handleAcceptTaskFromDetail = async (task: any, account?: SocialAccount) => {
    if (!task)
      return

    // 使用选中的推荐草稿（如果有）; 不要使用回退素材，直接发布模式下不自动填充
    // const material will be read again after accept to ensure current selectedMaterial is used

    // Close detail modal
    setTaskDetailModalVisible(false)

    // Show progress modal
    setTaskProgressVisible(true)
    setTaskProgress({
      currentStep: 0,
      steps: [
        { title: t('acceptingTask'), status: 'processing' },
        { title: t('publishingTask'), status: 'wait' },
        { title: t('submittingTask'), status: 'wait' },
        { title: t('taskCompleted'), status: 'wait' },
      ],
    })

    try {
      // 第一步：接受任务（只接受，不自动发布）
      const response: any = await acceptTask(task.id, task.opportunityId, account?.id)
      if (response && response.code === 0 && response.data.id) {
        // 接受成功，准备打开发布弹窗以供用户确认发布
        const publishAccount = account || getAccountById(task.accountId)
        const material = selectedMaterial

        // 保存待提交任务信息，等待用户在发布弹窗发布后调用提交接口（可能没有 material）
        setPendingUserTaskIdForPublish(response.data.id)
        setPendingTaskMaterialIdForPublish(material?._id)
        setPendingTaskForPublish(task)

        // 初始化发布弹窗的数据（传入当前的账号列表并默认选中发布账号）
        try {
          usePublishDialog.getState().init(accountList.length > 0 ? accountList : (publishAccount ? [publishAccount] : []), publishAccount?.id)

          // 预填充当前账号的发布参数（优先使用推荐草稿 material，否则使用 task 的描述/标题）
          const videos = material?.mediaList?.filter((m: any) => m.type === 'video') || []
          const images = material?.mediaList?.filter((m: any) => m.type !== 'video') || []

          const imgFiles = images.map((img: any) => ({
            id: generateUUID(),
            size: 0,
            file: {} as any,
            imgUrl: getOssUrl(img.url),
            filename: '',
            imgPath: '',
            width: 0,
            height: 0,
            ossUrl: getOssUrl(img.url),
          }))

          const videoFile = videos.length > 0 ? {
            size: 0,
            file: {} as any,
            videoUrl: '',
            ossUrl: getOssUrl(videos[0].url),
            filename: '',
            width: 0,
            height: 0,
            duration: 0,
            cover: {
              id: generateUUID(),
              size: 0,
              file: {} as any,
              imgUrl: material?.coverUrl ? getOssUrl(material.coverUrl) : (videos[0].cover ? getOssUrl(videos[0].cover) : ''),
              filename: '',
              imgPath: '',
              width: 0,
              height: 0,
              ossUrl: material?.coverUrl ? getOssUrl(material.coverUrl) : (videos[0].cover ? getOssUrl(videos[0].cover) : ''),
            },
          } as any : undefined

          const pubParmas: any = {
            des: material?.desc || task.description || '',
            title: material?.title || task.title || '',
            images: imgFiles.length > 0 ? imgFiles : undefined,
            video: videoFile,
            option: {},
          }

          if (publishAccount) {
            // 如果选择了草稿则预填参数，否则不预填
            if (material) {
              usePublishDialog.getState().setOnePubParams(pubParmas, publishAccount.id)
            }
            setPublishDefaultAccountId(publishAccount.id)
          }
        }
        catch (err) {
          console.error('初始化发布弹窗数据失败', err)
        }

        // 打开发布弹窗，用户手动确认发布
        setTaskDetailModalVisible(false)
        // 把 taskId 传入 PublishDialog，供其在发布完成时调用回调
        setPublishDialogOpen(true)
        // 切换到已接受任务标签
        setActiveTab('accepted')
        // 刷新任务列表
        fetchPendingTasks()
        fetchAcceptedTasks()
      }
    }
    catch (error) {
      toast.error('Task processing failed')
      setTaskProgressVisible(false)
    }
  }

  // 已经接受没有完成的任务 去完成
  const handleCompleteTask = async () => {
    if (!currentTaskId)
      return

    // Check if the platform requires App operation
    const publishAccount = getAccountById(acceptedTaskDetail.accountId)
    if (publishAccount) {
      const appRequiredPlatforms = getTasksRequiringApp([publishAccount.type])

      if (appRequiredPlatforms.length > 0) {
        // Platform requires App operation, show download prompt
        const firstPlatform = appRequiredPlatforms[0]
        const config = getAppDownloadConfig(firstPlatform)

        if (config) {
          setDownloadAppConfig({
            platform: config.platform,
            appName: config.appName,
            downloadUrl: config.downloadUrl,
            qrCodeUrl: config.qrCodeUrl,
          })
          setDownloadAppVisible(true)
          return
        }
      }
    }

    // 显示进度弹窗
    setTaskProgressVisible(true)
    setTaskProgress({
      currentStep: 0,
      steps: [
        { title: t('completeTask' as any), status: 'processing' },
        { title: t('publishingTask' as any), status: 'wait' },
        { title: t('submittingTask' as any), status: 'wait' },
        { title: t('taskCompleted' as any), status: 'wait' },
      ],
    })

    try {
      // Update progress: step 1 complete, start step 2
      setTaskProgress(prev => ({
        ...prev,
        currentStep: 1,
        steps: [
          { title: t('completeTask'), status: 'finish' },
          { title: t('publishingTask'), status: 'processing' },
          { title: t('submittingTask'), status: 'wait' },
          { title: t('taskCompleted'), status: 'wait' },
        ],
      }))

      // 第二步：发布任务
      const publishAccount = getAccountById(acceptedTaskDetail.accountId)
      if (publishAccount) {
        // 处理素材链接，确保使用完整链接
        const processedMaterials = acceptedTaskDetail.task?.materials?.map((material: any) => ({
          ...material,
          coverUrl: material.coverUrl ? getOssUrl(material.coverUrl) : undefined,
          mediaList: material.mediaList?.map((media: any) => ({
            ...media,
            url: getOssUrl(media.url),
            coverUrl: media.coverUrl ? getOssUrl(media.coverUrl) : undefined,
          })),
        }))

        const publishData = {
          flowId: `${publishAccount.uid}_${generateUUID()}`, // 使用账号的uid作为flowId
          accountType: publishAccount.type,
          accountId: publishAccount.id,
          title: acceptedTaskDetail.task?.title,
          desc: acceptedTaskDetail.task?.description,
          type: acceptedTaskDetail.task?.type as any, // 转换为PubType
          // 处理素材数据
          videoUrl: processedMaterials?.[0]?.mediaList?.[0]?.type === 'video'
            ? getOssUrl(processedMaterials[0].mediaList[0].url)
            : undefined,
          coverUrl: processedMaterials?.[0]?.coverUrl,
          imgUrlList: processedMaterials?.flatMap((material: any) =>
            material.mediaList?.filter((media: any) => media.type !== 'video')
              .map((media: any) => getOssUrl(media.url)) || [],
          ),
          option: {},
          topics: [],
          publishTime: getUtcDays(getDays().add(6, 'minute')).format(),
          userTaskId: acceptedTaskDetail.task?.id,
          taskMaterialId: acceptedTaskDetail.task?.materialIds[0],

        }

        const publishResponse: any = await apiCreatePublish(publishData)
        if (publishResponse && publishResponse.code === 0) {
          // Update progress: step 2 complete, start step 3
          setTaskProgress(prev => ({
            ...prev,
            currentStep: 2,
            steps: [
              { title: t('completeTask'), status: 'finish' },
              { title: t('publishingTask'), status: 'finish' },
              { title: t('submittingTask'), status: 'processing' },
              { title: t('taskCompleted'), status: 'wait' },
            ],
          }))

          // 第三步：提交任务
          const userTaskId = acceptedTaskDetail.id
          const submitResponse: any = await submitTask(userTaskId, acceptedTaskDetail.task?.materialIds[0])

          if (submitResponse && submitResponse.code === 0) {
            // Update progress: step 3 complete, start step 4
            setTaskProgress(prev => ({
              ...prev,
              currentStep: 3,
              steps: [
                { title: t('completeTask'), status: 'finish' },
                { title: t('publishingTask'), status: 'finish' },
                { title: t('submittingTask'), status: 'finish' },
                { title: t('taskCompleted'), status: 'finish' },
              ],
            }))

            // 延迟1秒后关闭进度窗口并刷新任务列表
            setTimeout(() => {
              setTaskProgressVisible(false)
              setAcceptedTaskDetailModalVisible(false)
              setAcceptedTaskDetail(null)
              setCurrentTaskId(null)
              fetchAcceptedTasks()
            }, 1000)
          }
          else {
            throw new Error('Failed to submit task')
          }
        }
        else {
          throw new Error('Failed to publish task')
        }
      }
      else {
        throw new Error('Cannot find publish account info')
      }
    }
    catch (error) {
      console.error('Task processing failed:', error)
      toast.error('Task processing failed')
      setTaskProgressVisible(false)
    }
  }

  // Handle pending task page change
  const handlePendingPageChange = (page: number, pageSize?: number) => {
    fetchPendingTasks(page, pageSize || pendingPagination.pageSize)
  }

  // 处理已接受任务分页变化
  const handleAcceptedPageChange = (page: number, pageSize?: number) => {
    fetchAcceptedTasks(page, pageSize || acceptedPagination.pageSize)
  }

  // 处理媒体点击
  const handleMediaClick = (media: any, materialTitle?: string) => {
    if (media.type === 'video') {
      setPreviewMedia({
        type: 'video',
        url: getOssUrl(media.url),
        title: materialTitle,
      })
    }
    else {
      setPreviewMedia({
        type: 'image',
        url: getOssUrl(media.url),
        title: materialTitle,
      })
    }
    setMediaPreviewVisible(true)
  }

  // 处理视频封面点击
  const handleVideoCoverClick = (media: any, materialTitle?: string) => {
    setPreviewMedia({
      type: 'video',
      url: getOssUrl(media.url),
      title: materialTitle,
    })
    setMediaPreviewVisible(true)
  }

  // 关闭媒体预览
  const handleCloseMediaPreview = () => {
    // 停止视频播放
    if (videoRef) {
      videoRef.pause()
      videoRef.currentTime = 0
    }
    setMediaPreviewVisible(false)
    setPreviewMedia(null)
    setVideoRef(null)
  }

  useEffect(() => {
    if (token) {
      fetchPendingTasks()
      fetchAcceptedTasks()
      fetchAccountList()
    }
  }, [token])

  // 监听账号列表变化，检查是否有新添加的符合条件账号
  useEffect(() => {
    if (accountList.length > 0) {
      checkForNewAccounts()
    }
  }, [accountList, requiredAccountTypes, taskDetail])

  // 发布弹窗发布成功回调：校验选中账户是否符合任务要求，符合则提交任务
  const handlePublishSuccess = async () => {
    try {
      // 取得发布时选中的账户
      const pubListChoosed = usePublishDialog.getState().pubListChoosed || []
      if (pubListChoosed.length === 0) {
        toast.error(t('publish.noAccountSelected' as any) || 'No account selected for publish')
        return
      }

      const usedAccount = pubListChoosed[0].account

      // 校验：如果任务指定了 accountId，则必须一致；否则检查账户类型是否被任务接受
      const task = pendingTaskForPublish
      let ok = false
      if (task) {
        if (task.accountId) {
          ok = usedAccount.id === task.accountId
        }
        else if (task.accountTypes && task.accountTypes.length > 0) {
          ok = task.accountTypes.includes(usedAccount.type)
        }
        else {
          ok = true
        }
      }

      if (!ok) {
        toast.error(t('publish.accountNotMatchTask' as any) || 'Selected account does not match task requirement')
        return
      }

      // 直接调用提交任务接口（不再弹出“任务处理中”弹窗）
      if (pendingUserTaskIdForPublish && pendingTaskMaterialIdForPublish) {
        const submitResp: any = await submitTask(pendingUserTaskIdForPublish, pendingTaskMaterialIdForPublish)
        if (submitResp && submitResp.code === 0) {
          toast.success(t('messages.submitTaskSuccess' as any) || 'Submit task success')
          fetchAcceptedTasks()
        }
        else {
          toast.error(t('messages.submitTaskFailed' as any) || 'Submit task failed')
        }
      }
    }
    catch (err) {
      console.error('handlePublishSuccess failed', err)
      toast.error(t('messages.submitTaskFailed' as any) || 'Submit task failed')
    }
    finally {
      // 清理临时状态并关闭发布弹窗
      setPublishDialogOpen(false)
      setPublishDefaultAccountId(undefined)
      setPendingUserTaskIdForPublish(undefined)
      setPendingTaskMaterialIdForPublish(undefined)
      setPendingTaskForPublish(null)
      try {
        usePublishDialog.getState().clear()
        usePublishDialog.getState().setPubListChoosed([])
      }
      catch (e) {
        // ignore
      }
    }
  }

  return (
    <div className={styles.taskPage}>
      {/* <div className={styles.header}>
        <h1>任务中心</h1>
        <p>接受任务，完成任务，获得奖励</p>
      </div> */}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={styles.tabs}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <ClockCircleOutlined />
            &nbsp;
            {t('pendingTasks')}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <PlayCircleOutlined />
            &nbsp;
            {t('acceptedTasks')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Spin spinning={loading}>
            {pendingTasks.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {pendingTasks.map((task: any) => {
                    const publishAccount = getAccountById(task.accountId)
                    return (
                      <Card
                        key={task.id}
                        className={styles.taskCard}
                        style={{ marginBottom: 0, position: 'relative' }}
                      >
                        {/* 未读红点标识 */}
                        {!task.isView && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#ff4d4f',
                            borderRadius: '50%',
                            zIndex: 1,
                            boxShadow: '0 0 0 2px #fff',
                          }}
                          />
                        )}

                        <div className={styles.taskHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* 显示多个平台图标 */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {(task.accountTypes && task.accountTypes.length > 0 ? task.accountTypes : [task.accountType]).map((platformType: string, index: number) => (
                                <Image
                                  key={platformType}
                                  src={getPlatformIcon(platformType)}
                                  alt="platform"
                                  width={20}
                                  height={20}
                                />
                              ))}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>
                              {task.accountTypes && task.accountTypes.length > 0
                                ? `${task.accountTypes.map((type: string) => getPlatformName(type)).join(', ')} Task`
                                : `${getPlatformName(task.accountType)} Task`}
                            </h3>
                          </div>
                          <Badge className={getBadgeClassName('orange')}>{t('taskStatus.pending' as any)}</Badge>
                        </div>

                        <div className={styles.taskContent}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span>
                              <strong>
                                {t('taskInfo.publishTime' as any)}
                                ：
                              </strong>
                              {formatTime(task.createdAt)}
                            </span>
                            <span>
                              <strong>
                                {t('taskInfo.endTime' as any)}
                                ：
                              </strong>
                              {formatAbsoluteTime(task.expiredAt)}
                            </span>
                          </div>

                          {task.reward > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong>
                                {t('taskInfo.reward' as any)}
                                ：
                              </strong>
                              <span style={{ color: '#f50', fontWeight: 'bold' }}>
                                CNY
                                {task.reward / 100}
                              </span>
                            </div>
                          )}

                          {task.cpmReward > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong>
                                {t('taskInfo.CPM' as any)}
                                ：
                              </strong>
                              <span style={{ color: '#f50', fontWeight: 'bold' }}>
                                CNY
                                {task.cpmReward / 100}
                              </span>
                            </div>
                          )}

                          {/* 发布账号信息 */}
                          {publishAccount && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '6px',
                              marginBottom: '12px',
                            }}
                            >
                              <Image
                                src={publishAccount.avatar ? getOssUrl(publishAccount.avatar) : '/default-avatar.png'}
                                alt="Account avatar"
                                width={32}
                                height={32}
                                style={{
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                                onError={(e: any) => {
                                  e.target.src = '/default-avatar.png'
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                  {publishAccount.nickname}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {getPlatformName(publishAccount.type)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={styles.taskActions}>
                              <Button
                                onClick={(e) => { e.stopPropagation(); handleViewTaskDetail(task.id) }}
                                style={{ width: '100%' }}
                              >
                            <EyeOutlined />
                            &nbsp;
                            {t('viewDetails')}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Pagination
                    current={pendingPagination.current}
                    pageSize={pendingPagination.pageSize}
                    total={pendingPagination.total}
                    onChange={handlePendingPageChange}
                    onShowSizeChange={handlePendingPageChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => t('messages.pageInfo' as any, { start: range[0], end: range[1], total })}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </div>
            ) : (
              <Empty description={t('messages.noPendingTasks')} />
            )}
          </Spin>
        </TabsContent>

        <TabsContent value="accepted">
          <Spin spinning={loading}>
            {acceptedTasks.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {acceptedTasks.map((task: any) => {
                    const publishAccount = getAccountById(task.accountId)
                    return (
                      <Card
                        key={task.id}
                        className={styles.taskCard}
                        style={{ marginBottom: 0 }}
                      >
                        <div className={styles.taskHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* 显示多个平台图标 */}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {(task.accountTypes && task.accountTypes.length > 0 ? task.accountTypes : [task.accountType]).map((platformType: string, index: number) => (
                                <Image
                                  key={platformType}
                                  src={getPlatformIcon(platformType)}
                                  alt="platform"
                                  width={20}
                                  height={20}
                                />
                              ))}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>
                              {task.accountTypes && task.accountTypes.length > 0
                                ? `${task.accountTypes.map((type: string) => getPlatformName(type)).join('、')}Task`
                                : `${getPlatformName(task.accountType)}Task`}
                            </h3>
                          </div>
                          <Badge className={getBadgeClassName(getTaskStatusTag(task.status).color)}>
                            {getTaskStatusTag(task.status).text}
                          </Badge>
                        </div>

                        <div className={styles.taskContent}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span>
                              <strong>
                                {t('taskInfo.acceptTime' as any)}
                                ：
                              </strong>
                              {formatTime(task.createdAt)}
                            </span>
                            <span> </span>
                          </div>

                          {task.reward > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong>
                                {t('taskInfo.reward' as any)}
                                ：
                              </strong>
                              <span style={{ color: '#f50', fontWeight: 'bold' }}>
                                CNY
                                {task.reward / 100}
                              </span>
                            </div>
                          )}

                          {task.cpmReward > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong>
                                {t('taskInfo.CPM' as any)}
                                ：
                              </strong>
                              <span style={{ color: '#f50', fontWeight: 'bold' }}>
                                CNY
                                {task.cpmReward / 100}
                              </span>
                            </div>
                          )}

                          {/* 发布账号信息 */}
                          {publishAccount && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '6px',
                              marginBottom: '12px',
                            }}
                            >
                              <Image
                                src={publishAccount.avatar ? getOssUrl(publishAccount.avatar) : '/default-avatar.png'}
                                alt="Account avatar"
                                width={32}
                                height={32}
                                style={{
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                                onError={(e: any) => {
                                  e.target.src = '/default-avatar.png'
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>
                                  {publishAccount.nickname}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {getPlatformName(publishAccount.type)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={styles.taskActions}>
                          <Button
                            onClick={(e) => { e.stopPropagation(); handleViewAcceptedTaskDetail(task.id) }}
                            style={{ width: '100%' }}
                          >
                            <EyeOutlined />
                            &nbsp;
                            {t('viewDetails')}
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Pagination
                    current={acceptedPagination.current}
                    pageSize={acceptedPagination.pageSize}
                    total={acceptedPagination.total}
                    onChange={handleAcceptedPageChange}
                    onShowSizeChange={handleAcceptedPageChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => t('messages.pageInfo' as any, { start: range[0], end: range[1], total })}
                    pageSizeOptions={['10', '20', '50', '100']}
                  />
                </div>
              </div>
            ) : (
              <Empty description={t('messages.noAcceptedTasks')} />
            )}
          </Spin>
        </TabsContent>
      </Tabs>

      {/* 提交任务弹窗 */}
      <Modal
        title={t('modal.submitTask')}
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submittingTaskId !== null}
        okText={t('modal.confirmSubmit')}
        cancelText={t('modal.cancel')}
      >
        <div style={{ marginBottom: '16px' }}>
          <label>
            {t('modal.submitLink')}
            ：
          </label>
          <Input
            value={submissionUrl}
            onChange={e => setSubmissionUrl(e.target.value)}
            placeholder={t('modal.submitLinkPlaceholder')}
            style={{ marginTop: '8px' }}
          />
        </div>
        <p style={{ color: '#666', fontSize: '12px' }}>
          {t('modal.submitTip')}
        </p>
      </Modal>

      {/* 任务详情弹窗 */}
      <Modal
        title={t('taskDetails')}
        open={taskDetailModalVisible}
        onCancel={() => {
          setTaskDetailModalVisible(false)
          setTaskDetail(null)
          setMaterialList([])
          setSelectedMaterial(null)
        }}
        footer={null}
        width={1200}
        zIndex={15}
      >
        <Spin spinning={taskDetailLoading}>
          {taskDetail ? (
            <div>
              {/* 任务基本信息 */}
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
              }}
              >
                <h2 style={{
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                }}
                >
                  {taskDetail.title}
                </h2>

                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#495057',
                  marginBottom: '12px',
                }}
                >
                  <div dangerouslySetInnerHTML={{ __html: taskDetail.description }} />
                </div>

                {/* 任务信息卡片 */}
                <Row gutter={12}>
                  {taskDetail.reward > 0 && (
                    <Col span={8}>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                      >
                        <div style={{ fontSize: '12px', color: '#856404', marginBottom: '4px' }}>
                          {t('taskInfo.reward' as any)}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d63031' }}>
                          CNY
                          {' '}
                          {taskDetail.reward / 100}
                        </div>
                      </div>
                    </Col>
                  )}

                  {taskDetail.cpmReward > 0 && (
                    <Col span={8}>
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                      >
                        <div style={{ fontSize: '12px', color: '#856404', marginBottom: '4px' }}>
                          {t('taskInfo.CPM' as any)}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d63031' }}>
                          CNY
                          {' '}
                          {taskDetail.cpmReward / 100}
                        </div>
                      </div>
                    </Col>
                  )}

                  <Col span={8}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#d1ecf1',
                      border: '1px solid #bee5eb',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                    >
                      <div style={{ fontSize: '12px', color: '#0c5460', marginBottom: '4px' }}>
                        {t('taskInfo.type' as any)}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#0c5460' }}>
                        {getTaskTypeName(taskDetail.type)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* 草稿选择区域 */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>{t('draft.recommendedDraft' as any) || t('draft.selectDraft')}</span>
                  </div>
                </div>

                {/* 推荐任务草稿列表 */}
                <Spin spinning={materialLoading}>
                  {materialList.length > 0 ? (
                    <>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '16px',
                      }}
                      >
                          {materialList.map((material: any) => (
                            <div
                              key={material._id}
                              onClick={(e) => { e.stopPropagation(); setSelectedMaterial(material) }}
                            style={{
                              border: selectedMaterial?._id === material._id ? '2px solid #1890ff' : '1px solid #e8e8e8',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              backgroundColor: selectedMaterial?._id === material._id ? '#e6f7ff' : '#fff',
                            }}
                          >
                            {/* 素材封面 */}
                            <div style={{
                              position: 'relative',
                              paddingTop: '56.25%',
                              background: '#f0f0f0',
                            }}
                            >
                              {material.coverUrl && (
                                <Image
                                  src={getOssUrl(material.coverUrl)}
                                  alt={material.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 33vw"
                                  style={{
                                    objectFit: 'cover',
                                  }}
                                />
                              )}
                              {material.mediaList && material.mediaList[0]?.type === 'video' && (
                                <div style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  color: 'white',
                                  fontSize: '32px',
                                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                }}
                                >
                                  ▶
                                </div>
                              )}
                              {selectedMaterial?._id === material._id && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: '#1890ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '14px',
                                }}
                                >
                                  ✓
                                </div>
                              )}
                            </div>

                            {/* 素材信息 */}
                            <div style={{ padding: '12px' }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              >
                                {material.title || t('draft.noTitle')}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#999',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              >
                                {material.desc || t('draft.noDescription')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 分页 */}
                      {materialPagination.total > materialPagination.pageSize && (
                        <div style={{ textAlign: 'center' }}>
                          <Pagination
                            current={materialPagination.current}
                            pageSize={materialPagination.pageSize}
                            total={materialPagination.total}
                            onChange={(page, pageSize) => {
                              if (taskDetail.materialGroupId) {
                                fetchMaterialList(taskDetail.materialGroupId, page, pageSize)
                              }
                            }}
                            showSizeChanger={false}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <Empty description={t('draft.noDrafts')} />
                  )}
                </Spin>

                {/* 选中的推荐草稿信息展示 */}
                {selectedMaterial && (
                  <div style={{
                    border: '2px solid #1890ff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#e6f7ff',
                    padding: '16px',
                  }}
                  >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {selectedMaterial.coverUrl && (
                        <div style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                        >
                          <Image
                            src={getOssUrl(selectedMaterial.coverUrl)}
                            alt={selectedMaterial.title}
                            width={120}
                            height={120}
                            style={{
                              objectFit: 'cover',
                              width: '100%',
                              height: '100%',
                            }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                          {selectedMaterial.title || t('draft.noTitle')}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {selectedMaterial.desc || t('draft.noDescription')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部按钮 */}
              {taskDetail.status === 'active' && taskDetail.currentRecruits < taskDetail.maxRecruits && (
                <div style={{
                  textAlign: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #e8e8e8',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                }}
                >
                  <Button
                    size="lg"
                    onClick={() => {
                      // 模式1：使用推荐草稿发布（必须选中推荐草稿）
                      if (!selectedMaterial) {
                        toast.error(t('draft.pleaseSelectDraftMaterial'))
                        return
                      }
                      // 复用账号选择流程
                      handleTaskAction(taskDetail)
                    }}
                  >
                    {t('publish.useRecommended' as any) || '推荐草稿发布'}
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => {
                      // 模式2：直接发布（不使用推荐草稿）
                      setSelectedMaterial(null)
                      handleTaskAction(taskDetail)
                    }}
                  >
                    {t('publish.directPublish' as any) || '直接发布'}
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => {
                      // 模式3：Agent 发布，跳转到首页并填充输入
                      const prompt = taskDetail.description || taskDetail.title || ''
                      try {
                        localStorage.setItem('agentExternalPrompt', prompt)
                        localStorage.setItem('agentTaskId', taskDetail.id || '')
                      }
                      catch (e) {
                        console.error('localStorage error', e)
                      }
                      router.push(`/${lng}`)
                    }}
                  >
                    {t('publish.agentPublish' as any) || 'Agent 发布'}
                  </Button>
                </div>
              )}
            </div>
          ) : !taskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              {t('messages.noTaskDetails')}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 已移除：我的草稿选择，当前仅支持推荐草稿和直接发布/Agent 发布 */}

      {/* 已接受任务详情弹窗 */}
      <Modal
        title={t('taskDetails')}
        open={acceptedTaskDetailModalVisible}
        onCancel={() => {
          setAcceptedTaskDetailModalVisible(false)
          setAcceptedTaskDetail(null)
        }}
        footer={[]}
        width={800}
        zIndex={2000}
      >
        <Spin spinning={acceptedTaskDetailLoading}>
          {acceptedTaskDetail ? (
            <div>
              {/* 视频发布风格布局 */}
              <div style={{
                display: 'flex',
                gap: '24px',
                marginBottom: '24px',
              }}
              >
                {/* Left side: Video/Media content */}
                <div style={{ flex: '0 0 400px' }}>
                  <Spin spinning={acceptedTaskMaterialLoading}>
                    {acceptedTaskMaterialList.length > 0 && acceptedTaskMaterialList[0].mediaList && acceptedTaskMaterialList[0].mediaList.length > 0 && (
                      <div style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backgroundColor: '#000',
                      }}
                      >
                        <div style={{ position: 'relative', cursor: 'pointer' }}>
                          {acceptedTaskMaterialList[0].mediaList[0].type === 'video' ? (
                            <div
                              style={{
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            onClick={(e) => { e.stopPropagation(); handleVideoCoverClick(acceptedTaskMaterialList[0].mediaList[0], acceptedTaskDetail.task.title) }}
                            >
                              {/* Video cover image */}
                              <Image
                                src={acceptedTaskMaterialList[0].coverUrl ? getOssUrl(acceptedTaskMaterialList[0].coverUrl) : getOssUrl(acceptedTaskMaterialList[0].mediaList[0].url)}
                                alt="video cover"
                                width={400}
                                height={300}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                }}
                              />
                              {/* Play button */}
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'white',
                                fontSize: '24px',
                                background: 'rgba(0,0,0,0.7)',
                                borderRadius: '50%',
                                width: '60px',
                                height: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                              }}
                              >
                                ▶
                              </div>
                            </div>
                          ) : acceptedTaskMaterialList[0].mediaList[0].type === 'img' ? (
                            <Image
                              src={getOssUrl(acceptedTaskMaterialList[0].mediaList[0].url)}
                              alt="media"
                              width={400}
                              height={300}
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block',
                              }}
                            onClick={(e) => { e.stopPropagation(); handleMediaClick(acceptedTaskMaterialList[0].mediaList[0], acceptedTaskDetail.task.title) }}
                            />
                          ) : null}
                        </div>
                      </div>
                    )}
                  </Spin>
                </div>

                {/* 右侧：标题和描述 */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  {/* 标题区域 */}
                  <div style={{ marginBottom: '16px' }}>
                    <h2 style={{
                      margin: '0 0 8px 0',
                      fontSize: '20px',
                      fontWeight: '600',
                      lineHeight: '1.4',
                      color: '#1a1a1a',
                    }}
                    >
                      {acceptedTaskDetail.task?.title}
                    </h2>

                    {/* 发布账号信息 */}
                    {acceptedTaskDetail.accountId && (() => {
                      const publishAccount = getAccountById(acceptedTaskDetail.accountId)
                      return publishAccount
                        ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '12px',
                            }}
                            >
                              <Image
                                src={publishAccount.avatar ? getOssUrl(publishAccount.avatar) : '/default-avatar.png'}
                                alt="account avatar"
                                width={32}
                                height={32}
                                style={{
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                                onError={(e: any) => {
                                  e.target.src = '/default-avatar.png'
                                }}
                              />
                              <div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#1a1a1a',
                                }}
                                >
                                  {publishAccount.nickname}
                                </div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#666',
                                }}
                                >
                                  {getPlatformName(publishAccount.type)}
                                </div>
                              </div>
                            </div>
                          )
                        : null
                    })()}
                  </div>

                  {/* 描述区域 */}
                  <div style={{
                    marginBottom: '16px',
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                  }}
                  >
                    <div style={{
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: '#495057',
                    }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: acceptedTaskDetail.task?.description }} />
                    </div>
                  </div>

                  {/* 任务信息卡片 */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                  >
                    {acceptedTaskDetail.reward > 0 && (
                      <div style={{
                        flex: '1',
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                      >
                        <div style={{
                          fontSize: '12px',
                          color: '#856404',
                          marginBottom: '4px',
                        }}
                        >
                          {t('taskInfo.reward' as any)}
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#d63031',
                        }}
                        >
                          CNY
                          {' '}
                          {acceptedTaskDetail.reward / 100}
                        </div>
                      </div>
                    )}

                    {acceptedTaskDetail.cpmReward > 0 && (
                      <div style={{
                        flex: '1',
                        padding: '12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                      >
                        <div style={{
                          fontSize: '12px',
                          color: '#856404',
                          marginBottom: '4px',
                        }}
                        >
                          {t('taskInfo.CPM' as any)}
                        </div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#d63031',
                        }}
                        >
                          CNY
                          {' '}
                          {acceptedTaskDetail.cpmReward / 100}
                        </div>
                      </div>
                    )}

                    <div style={{
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#d1ecf1',
                      border: '1px solid #bee5eb',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                    >
                      <div style={{
                        fontSize: '12px',
                        color: '#0c5460',
                        marginBottom: '4px',
                      }}
                      >
                        {t('taskInfo.type' as any)}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#0c5460',
                      }}
                      >
                        {getTaskTypeName(acceptedTaskDetail.task?.type)}
                      </div>
                    </div>
                  </div>

                  {/* 任务状态信息 */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                  >
                    <div style={{
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#e2e3e5',
                      border: '1px solid #d6d8db',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                    >
                      <div style={{
                        fontSize: '12px',
                        color: '#495057',
                        marginBottom: '4px',
                      }}
                      >
                        {t('taskInfo.acceptTime')}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#495057',
                      }}
                      >
                        {formatTime(acceptedTaskDetail.createdAt)}
                      </div>
                    </div>

                    <div style={{
                      flex: '1',
                      padding: '12px',
                      backgroundColor: '#e2e3e5',
                      border: '1px solid #d6d8db',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                    >
                      <div style={{
                        fontSize: '12px',
                        color: '#495057',
                        marginBottom: '4px',
                      }}
                      >
                        {t('taskInfo.submitTime')}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#495057',
                      }}
                      >
                        {acceptedTaskDetail.submissionTime ? formatTime(acceptedTaskDetail.submissionTime) : t('notSubmitted')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部状态栏 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderTop: '1px solid #e8e8e8',
                marginTop: '16px',
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Badge 
                    className={getBadgeClassName(getTaskStatusTag(acceptedTaskDetail.status).color)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                    }}
                  >
                    {getTaskStatusTag(acceptedTaskDetail.status).text}
                  </Badge>
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                  }}
                  >
                    {acceptedTaskDetail.status === 'doing'
                      ? t('taskStatuses.taskPending')
                      : acceptedTaskDetail.status === 'pending'
                        ? t('taskStatuses.taskCompleted')
                        : `${t('taskStatuses.taskStatus')}: ${getTaskStatusTag(acceptedTaskDetail.status).text}`}
                  </span>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#999',
                }}
                >
                  {acceptedTaskDetail.isFirstTimeSubmission && (
                    <span style={{ color: '#52c41a' }}>{t('taskInfo.firstSubmission')}</span>
                  )}
                </div>
              </div>

              {/* 根据任务状态显示不同按钮 */}
              {(() => {
                // 如果是已接受任务且状态为doing（待完成），显示完成任务按钮
                if (acceptedTaskDetail.status === 'doing') {
                  return (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Button
                        size="lg"
                        onClick={handleCompleteTask}
                        style={{ marginTop: '12px' }}
                      >
                        {t('completeTask')}
                      </Button>
                    </div>
                  )
                }

                return null
              })()}
            </div>
          ) : !acceptedTaskDetailLoading && (
            <div style={{ textAlign: 'center', color: '#999' }}>
              {t('messages.noTaskDetails')}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 媒体预览弹窗 */}
      <Modal
        title={previewMedia?.title || t('modal.mediaPreview')}
        open={mediaPreviewVisible}
        onCancel={handleCloseMediaPreview}
        footer={[
          <Button key="close" onClick={handleCloseMediaPreview}>
            {t('modal.close')}
          </Button>,
        ]}
        width={previewMedia?.type === 'video' ? 800 : 600}
        zIndex={3000}
      >
        {previewMedia && (
          <div>
            {previewMedia.type === 'video' ? (
              <video
                ref={setVideoRef}
                src={previewMedia.url}
                controls
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  borderRadius: '8px',
                }}
                autoPlay
                onEnded={() => {
                  // 视频播放结束时重置到开始
                  if (videoRef) {
                    videoRef.currentTime = 0
                  }
                }}
              />
            ) : (
              <Image
                src={previewMedia.url}
                alt="preview"
                width={600}
                height={500}
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* 任务进度弹窗（已移除，提交后只显示 Toast 提示） */}

      {/* 账号选择弹窗 */}
      <Modal
        title={t('accountSelect.title' as any)}
        open={accountSelectVisible}
        onCancel={() => setAccountSelectVisible(false)}
        footer={null}
        width={600}
        zIndex={2500}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#666' }}>
            {t('accountSelect.description' as any)}
          </p>
        </div>
        <List
          dataSource={availableAccounts}
          renderItem={account => (
            <List.Item
              style={{
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff'
                e.currentTarget.style.backgroundColor = '#f6ffed'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f0f0f0'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              onClick={() => handleAccountSelect(account)}
            >
              <List.Item.Meta
                avatar={(
                  <Image
                    src={account.avatar ? getOssUrl(account.avatar) : '/default-avatar.png'}
                    alt="Account avatar"
                    width={48}
                    height={48}
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                    onError={(e: any) => {
                      e.target.src = '/default-avatar.png'
                    }}
                  />
                )}
                title={(
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{account.nickname}</span>
                    <Badge className={getBadgeClassName('blue')}>{getPlatformName(account.type)}</Badge>
                  </div>
                )}
                description={(
                  <div style={{ color: '#666' }}>
                    <div>
                      {t('accountSelect.accountId' as any)}
                      :
                      {' '}
                      {account.account}
                    </div>
                    {account.nickname && (
                      <div>
                        {t('accountSelect.nickname' as any)}
                        :
                        {' '}
                        {account.nickname}
                      </div>
                    )}
                  </div>
                )}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* 下载App提示弹窗 */}
      <DownloadAppModal
        visible={downloadAppVisible}
        onClose={() => setDownloadAppVisible(false)}
        platform={downloadAppConfig.platform}
        appName={downloadAppConfig.appName}
        downloadUrl={downloadAppConfig.downloadUrl}
        qrCodeUrl={downloadAppConfig.qrCodeUrl}
        zIndex={3000}
      />
      {/* 发布作品弹窗（用于任务流程触发） */}
      {accountList.length > 0 && (
        <PublishDialog
          open={publishDialogOpen}
          onClose={() => {
            setPublishDialogOpen(false)
            setPublishDefaultAccountId(undefined)
            setPendingUserTaskIdForPublish(undefined)
            setPendingTaskMaterialIdForPublish(undefined)
            setPendingTaskForPublish(null)
          }}
          accounts={accountList}
          defaultAccountId={publishDefaultAccountId}
          onPubSuccess={handlePublishSuccess}
          suppressAutoPublish={true}
          taskIdForPublish={pendingUserTaskIdForPublish}
          onPublishConfirmed={(taskId?: string) => {
            // 当 PublishDialog 内部确认发布完成时触发，继续提交任务
            handlePublishSuccess()
          }}
        />
      )}
    </div>
  )
}
