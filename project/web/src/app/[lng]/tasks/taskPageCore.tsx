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
import { List } from '@/components/ui/list'
import { Pagination } from '@/components/ui/pagination'
import { Row, Col } from '@/components/ui/grid'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { getAccountListApi } from '@/api/account'
import { apiGetMaterialList } from '@/api/material'
import { acceptTask, getTaskDetail, submitTask } from '@/api/notification'
import {
  apiGetTaskOpportunityList,
  apiGetUserTaskDetail,
  apiGetUserTaskList,
  apiMarkTaskAsViewed
} from '@/api/task'
import {
  apiGetSettleInfoByUserTask,
  apiGetSettleItemList,
} from '@/api/task'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useTransClient } from '@/app/i18n/client'
import MediaPreview from '@/components/common/MediaPreview'
import { useUserStore } from '@/store/user'
import { getOssUrl } from '@/utils/oss'
import styles from './taskPageCore.module.scss'
import PublishDialog from '@/components/PublishDialog'
import { usePublishDialog } from '@/components/PublishDialog/usePublishDialog'
import { openLoginModal } from '@/store/loginModal'

export default function TaskPageCore() {
  const { t } = useTransClient('task' as any)
  // use only task namespace translator `t` to avoid cross-namespace missing translations
  const token = useUserStore(state => state.token)
  const router = useRouter()
  const params = useParams()
  const lng = params.lng as string

  // Do not early return on missing token — render login prompt in JSX to preserve hook order

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

  // 推荐草稿选择状态（已移除：任务提交/发布不再依赖草稿，详情仅作展示）
  const [requiredAccountTypes, setRequiredAccountTypes] = useState<string[]>([])

  // Accepted task detail material list state
  const [acceptedTaskMaterialList, setAcceptedTaskMaterialList] = useState<any[]>([])
  const [acceptedTaskMaterialLoading, setAcceptedTaskMaterialLoading] = useState(false)
  // Accepted task settle items (from /task/settle endpoints)
  const [acceptedTaskSettleItems, setAcceptedTaskSettleItems] = useState<any[]>([])
  const [acceptedTaskSettleLoading, setAcceptedTaskSettleLoading] = useState(false)
  // 任务信息卡片数量，用于控制对齐（只有一个时左对齐）
  const infoItemsCount = (
    (taskDetail?.reward && taskDetail.reward > 0 ? 1 : 0) +
    (taskDetail?.cpmReward && taskDetail.cpmReward > 0 ? 1 : 0) +
    (taskDetail?.type ? 1 : 0)
  )
  // Publish dialog state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishDefaultAccountId, setPublishDefaultAccountId] = useState<string | undefined>(undefined)
  const [pendingUserTaskIdForPublish, setPendingUserTaskIdForPublish] = useState<string | undefined>(undefined)
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
      pending: { color: 'green', text: t('taskStatus.pending' as any) }, // pending: 已完成
      doing: { color: 'blue', text: t('taskStatus.doing' as any) }, // doing: 进行中
      accepted: { color: 'blue', text: t('taskStatus.accepted' as any) },
      completed: { color: 'green', text: t('taskStatus.completed' as any) },
      rejected: { color: 'red', text: t('taskStatus.rejected' as any) },
    }
    return statusMap[status] || { color: 'default', text: status }
  }

  // 将 antd Tag 的 color 转换为 Badge 的样式类
  const getBadgeClassName = (color?: string) => {
    const colorMap: Record<string, string> = {
      orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
      green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
      blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
      red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
      default: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100',
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
    // 如果任务指定了账号，使用指定账号的逻辑
    if (task.accountId) {
      const publishAccount = getAccountById(task.accountId)
      if (publishAccount) {
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
        // 示例仅用于展示，不在任务提交/发布流程中自动选择素材
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

        // 示例仅用于展示，不在任务提交/发布流程中自动选择素材

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

        // Fetch settle info/items for this accepted user task and show in modal
        try {
          fetchAcceptedTaskSettleInfo(taskId)
        }
        catch (err) {
          console.error('fetchAcceptedTaskSettleInfo failed', err)
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
  // Fetch settle info for an accepted user task (calls /task/settle/info/{userTaskId})
  const fetchAcceptedTaskSettleInfo = async (userTaskId: string) => {
    if (!userTaskId) return
    try {
      setAcceptedTaskSettleLoading(true)
      const infoResp: any = await apiGetSettleInfoByUserTask(userTaskId)
      // API may return id or _id. Accept both and fall back to empty list when missing.
      if (infoResp && infoResp.data && (infoResp.code === 0 || infoResp.success)) {
        const settleId = infoResp.data.id || infoResp.data._id || (infoResp.data as any).settleId
        if (settleId) {
          await fetchAcceptedTaskSettleItems(settleId)
        }
        else {
          setAcceptedTaskSettleItems([])
        }
      }
      else {
        setAcceptedTaskSettleItems([])
      }
    }
    catch (err) {
      console.error('Failed to fetch settle info:', err)
      setAcceptedTaskSettleItems([])
    }
    finally {
      setAcceptedTaskSettleLoading(false)
    }
  }

  // Fetch settle items list by settleId (calls /task/settle/item/list/{settleId})
  const fetchAcceptedTaskSettleItems = async (settleId: string) => {
    if (!settleId) return
    try {
      setAcceptedTaskSettleLoading(true)
      const itemsResp: any = await apiGetSettleItemList(settleId)
      if (itemsResp && itemsResp.data && (itemsResp.code === 0 || itemsResp.success)) {
        const rawList = itemsResp.data.list || itemsResp.data || []
        // normalize items for UI: provide `title` and `value` fields
        const normalized = (rawList as any[]).map(item => {
          const dataType = item.dataType || item.type || item.key
          // Try translate dataType; if translation returns the key itself, treat as missing and fallback.
          let titleFromType: string | undefined = undefined
          if (dataType) {
            const translated = t(`settle.dataType.${dataType}` as any)
            if (translated && !translated.includes('settle.dataType.')) {
              titleFromType = translated
            }
          }
          const title = titleFromType || item.title || item.name || dataType || ''
          const value = item.dataValue ?? item.value ?? item.amount ?? item.pricing ?? null
          return {
            ...item,
            title,
            value,
          }
        })
        setAcceptedTaskSettleItems(normalized)
      }
      else {
        setAcceptedTaskSettleItems([])
      }
    }
    catch (err) {
      console.error('Failed to fetch settle items:', err)
      setAcceptedTaskSettleItems([])
    }
    finally {
      setAcceptedTaskSettleLoading(false)
    }
  }

  // 从任务详情接受任务
  const handleAcceptTaskFromDetail = async (task: any, account?: SocialAccount) => {
    if (!task)
      return

    // Close detail modal
    setTaskDetailModalVisible(false)

    try {
      // 接受任务（只接受，不自动发布）
      const response: any = await acceptTask(task.id, task.opportunityId, account?.id)
      if (response && response.code === 0 && response.data.id) {
        // 接受成功，准备打开发布弹窗以供用户确认发布
        const publishAccount = account || getAccountById(task.accountId)
        // 不再使用推荐草稿作为发布/提交必须参数

        // 保存待提交任务信息（不再依赖素材 id）
        setPendingUserTaskIdForPublish(response.data.id)
        setPendingTaskForPublish(task)

        // 初始化发布弹窗的数据（传入当前的账号列表并默认选中发布账号）
        try {
          usePublishDialog.getState().init(accountList.length > 0 ? accountList : (publishAccount ? [publishAccount] : []), publishAccount?.id)

          if (publishAccount) {
            setPublishDefaultAccountId(publishAccount.id)
          }
        }
        catch (err) {
          console.error('初始化发布弹窗数据失败', err)
        }

        // 打开发布弹窗，用户手动确认发布
        setTaskDetailModalVisible(false)
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
    }
  }

  // 已经接受没有完成的任务 去完成
  const handleCompleteTask = async () => {
    if (!currentTaskId)
      return

    // 获取发布账号
    const publishAccount = getAccountById(acceptedTaskDetail.accountId)
    if (!publishAccount) {
      toast.error(t('messages.accountNotFound' as any) || 'Account not found')
      return
    }

    // 获取任务素材
    const materials = acceptedTaskDetail.task?.materials || []
    const material = materials.length > 0 ? materials[0] : null

    // 保存待提交任务信息（不再依赖素材 id）
    setPendingUserTaskIdForPublish(acceptedTaskDetail.id)
    // material id 不再用于提交流程
    setPendingTaskForPublish(acceptedTaskDetail.task)

    // 初始化发布弹窗的数据
    try {
      usePublishDialog.getState().init(accountList.length > 0 ? accountList : [publishAccount], publishAccount.id)
      setPublishDefaultAccountId(publishAccount.id)
    }
    catch (err) {
      console.error('初始化发布弹窗数据失败', err)
    }

    // 打开发布弹窗
    setAcceptedTaskDetailModalVisible(false)
    setPublishDialogOpen(true)
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

  // 如果未登录，重定向到登录页面（保留 hook 顺序，UI 不展示登录提示）
  useEffect(() => {
    if (!token) {
      // 打开登录弹窗并在登录成功后刷新列表
      try {
        openLoginModal(() => {
          fetchPendingTasks()
          fetchAcceptedTasks()
          fetchAccountList()
        })
      }
      catch (e) {
        console.error('open login modal failed', e)
      }
    }
  }, [token, router, lng])

  // 发布弹窗发布成功回调：校验选中账户是否符合任务要求，符合则提交任务
  const handlePublishSuccess = async () => {
    console.log('完成发布2222@@@')
    try {
      // 取得发布时选中的账户
      const pubListChoosed = usePublishDialog.getState().pubListChoosed || []

      // If opened from task flow and dialog didn't have an explicit selection,
      // fall back to the task's account (task specifies accountId).
      let usedAccount: SocialAccount | undefined
      if (pubListChoosed.length > 0) {
        usedAccount = pubListChoosed[0].account
      }
      else {
        // Prefer explicit publish default account if set
        if (publishDefaultAccountId) {
          usedAccount = getAccountById(publishDefaultAccountId) || undefined
        }
        // Otherwise, if the pending task has an accountId, use that
        if (!usedAccount && pendingTaskForPublish && pendingTaskForPublish.accountId) {
          usedAccount = getAccountById(pendingTaskForPublish.accountId) || undefined
        }
      }

      if (!usedAccount) {
        console.log('publish.noAccountSelected')
        toast.error(t('publish.noAccountSelected' as any) || 'No account selected for publish')
        return
      }

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
        console.log('publish.accountNotMatchTask')
        toast.error(t('publish.accountNotMatchTask' as any) || 'Selected account does not match task requirement')
        return
      }

      // 直接调用提交任务接口（不再依赖素材 id）
      if (pendingUserTaskIdForPublish) {
        const submitResp: any = await submitTask(pendingUserTaskIdForPublish)
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
      {token && (
      <>
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
        }}
        footer={null}
        width={1200}
        zIndex={15}
      >
        <Spin spinning={taskDetailLoading}>
          {taskDetail ? (
            <div>
              {/* 任务基本信息 */}
              <div className="mb-6 p-4 bg-background rounded-lg border border-border">
                <h2 className="mb-3 text-lg font-semibold text-foreground">
                  {taskDetail.title}
                </h2>

                <div className="text-sm leading-7 text-muted-foreground mb-3">
                  <div dangerouslySetInnerHTML={{ __html: taskDetail.description }} />
                </div>

                {/* 任务信息卡片 */}
                <div className={`${infoItemsCount === 1 ? 'grid grid-cols-1 justify-items-start' : 'grid grid-cols-3'} gap-3`}>
                  {taskDetail.reward > 0 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-md text-center">
                      <div className="text-xs text-warning mb-1">{t('taskInfo.reward' as any)}</div>
                      <div className="text-sm font-bold text-destructive">CNY {taskDetail.reward / 100}</div>
                    </div>
                  )}

                  {taskDetail.cpmReward > 0 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-md text-center">
                      <div className="text-xs text-warning mb-1">{t('taskInfo.CPM' as any)}</div>
                      <div className="text-sm font-bold text-destructive">CNY {taskDetail.cpmReward / 100}</div>
                    </div>
                  )}

                  {taskDetail.type && (
                    <div className="bg-muted/10 border border-muted/30 rounded-md text-center">
                      <div className="text-xs text-muted-foreground mb-1">{t('taskInfo.type' as any)}</div>
                      <div className="text-sm font-medium text-foreground">{getTaskTypeName(taskDetail.type)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 示例展示区域 */}
              <div style={{ marginBottom: '24px', marginTop: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>{t('draft.examples' as any) || '示例'}</span>
                  </div>
                </div>

                {/* 示例列表 */}
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
                            style={{
                              border: '1px solid #e8e8e8',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#fff',
                            }}
                          >
                            {/* 素材封面 */}
                <div style={{
                              position: 'relative',
                              paddingTop: '42%',
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
                          // 模式2：直接发布
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
                      // 通过 URL query 传参到首页，避免使用 localStorage
                      const params = new URLSearchParams()
                      if (prompt) params.set('agentExternalPrompt', prompt)
                      if (taskDetail?.id) params.set('agentTaskId', taskDetail.id)
                      router.push(`/${lng}?${params.toString()}`)
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
              <div className="space-y-4">
                {/* 右侧：标题和描述（已移除顶部媒体展示） */}
                <div className="flex-1">
                  {/* 标题区域 */}
                  <div className="mb-4">
                    <h2 className="mb-2 text-xl font-semibold text-foreground">
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
                  {
                    acceptedTaskDetail.task?.description && (
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
                    )
                  }
                  

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

                  {
                    acceptedTaskDetail.task?.type && (
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
                    )
                  }
                    
                  </div>

                  {/* 结算项（来自 /task/settle 接口），显示在接受时间上方 */}
                  {acceptedTaskSettleLoading ? (
                    <div style={{ marginBottom: '12px' }}>
                      <Spin spinning={true} />
                    </div>
                  ) : acceptedTaskSettleItems && acceptedTaskSettleItems.length > 0 ? (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ marginBottom: '8px', fontWeight: 600 }}>{t('settle.items' as any) || '结算信息'}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {acceptedTaskSettleItems.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px',
                              backgroundColor: '#f8f9fa',
                              border: '1px solid #e9ecef',
                              borderRadius: '8px',
                              minWidth: '120px',
                            }}
                          >
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              {item.title || item.name || item.key || JSON.stringify(item)}
                            </div>
                            {item.value !== undefined ? (
                              <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.value}</div>
                            ) : item.amount !== undefined ? (
                              <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.amount}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

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

              {/* 底部状态栏：左侧状态，右侧首次提交 */}
              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Badge className={getBadgeClassName(getTaskStatusTag(acceptedTaskDetail.status).color)} style={{ fontSize: 12, padding: '4px 8px' }}>
                    {getTaskStatusTag(acceptedTaskDetail.status).text}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {acceptedTaskDetail.status === 'doing'
                      ? t('taskStatuses.taskPending')
                      : acceptedTaskDetail.status === 'pending'
                        ? t('taskStatuses.taskCompleted')
                        : `${t('taskStatuses.taskStatus')}: ${getTaskStatusTag(acceptedTaskDetail.status).text}`}
                  </span>
                </div>

                {acceptedTaskDetail.isFirstTimeSubmission && (
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
                    {t('taskInfo.firstSubmission')}
                  </span>
                )}
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
      {previewMedia && (
        <MediaPreview
          open={mediaPreviewVisible}
          onClose={() => setMediaPreviewVisible(false)}
          items={[{ type: previewMedia.type, src: previewMedia.url, title: previewMedia.title || t('modal.mediaPreview') }]}
          initialIndex={0}
        />
      )}

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

      {/* 发布作品弹窗（用于任务流程触发） */}
      {accountList.length > 0 && (
        <PublishDialog
          open={publishDialogOpen}
          onClose={() => {
            setPublishDialogOpen(false)
            setPublishDefaultAccountId(undefined)
            setPendingUserTaskIdForPublish(undefined)
            setPendingTaskForPublish(null)
          }}
          accounts={accountList}
          defaultAccountId={publishDefaultAccountId}
          suppressAutoPublish={true}
          taskIdForPublish={pendingUserTaskIdForPublish}
          onPublishConfirmed={(taskId?: string) => {
            // 当 PublishDialog 内部确认发布完成时触发，继续提交任务
            handlePublishSuccess()
          }}
        />
      )}
      </>
      )}
    </div>
  )
}
