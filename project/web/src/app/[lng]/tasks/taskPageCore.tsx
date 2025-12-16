'use client'

import type {
  TaskOpportunity,
  UserTask,
} from '@/api/task'
import type { SocialAccount } from '@/api/types/account.type'
import type { PlatType } from '@/app/config/platConfig'
import { CheckOutlined, ClockCircleOutlined, EyeOutlined, PlayCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Input, List, Modal, Pagination, Radio, Row, Spin, Steps, Tabs, Tag, Tooltip } from 'antd'
import { toast } from '@/lib/toast'
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
import DraftSelectionModal from '@/components/PublishDialog/compoents/DraftSelectionModal'
import { useUserStore } from '@/store/user'
import { generateUUID } from '@/utils'
import { getOssUrl } from '@/utils/oss'
import styles from './taskPageCore.module.scss'

const { TabPane } = Tabs

export default function TaskPageCore() {
  const { t } = useTransClient('task' as any)
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

  // 草稿选择状态
  const [draftSource, setDraftSource] = useState<'task' | 'own'>('task') // 'task': Task draft, 'own': My draft
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null) // Selected task material
  const [draftModalOpen, setDraftModalOpen] = useState(false) // My draft selection modal
  const [requiredAccountTypes, setRequiredAccountTypes] = useState<string[]>([])

  // Accepted task detail material list state
  const [acceptedTaskMaterialList, setAcceptedTaskMaterialList] = useState<any[]>([])
  const [acceptedTaskMaterialLoading, setAcceptedTaskMaterialLoading] = useState(false)

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
    // 暂时简化，直接接受任务
    await doAcceptTask(task)

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
      else {
        toast.error(t('messages.acceptTaskFailed'))
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
        return `${minutes}分钟后`
      if (hours < 24)
        return `${hours}小时后`
      if (days < 7)
        return `${days}天后`
    }

    // 显示具体日期时间
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 获取任务状态标签
  const getTaskStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string, text: string }> = {
      pending: { color: 'green', text: '已完成' }, // pending 是已完成
      doing: { color: 'orange', text: '待完成' }, // doing 是待完成
      accepted: { color: 'blue', text: t('taskStatus.accepted' as any) },
      completed: { color: 'green', text: t('taskStatus.completed' as any) },
      rejected: { color: 'red', text: t('taskStatus.rejected' as any) },
    }
    return statusMap[status] || { color: 'default', text: status }
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
      console.error('获取素材列表失败:', error)
      toast.error('获取素材列表失败')
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

        // 重置草稿选择状态
        setDraftSource('task')
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

    // 验证是否选择了素材
    if (!selectedMaterial) {
      toast.error('请选择一个草稿素材')
      return
    }

    // 关闭详情弹窗
    setTaskDetailModalVisible(false)

    // 显示进度弹窗
    setTaskProgressVisible(true)
    setTaskProgress({
      currentStep: 0,
      steps: [
        { title: '正在接受任务...', status: 'processing' },
        { title: '正在发布任务...', status: 'wait' },
        { title: '正在提交任务...', status: 'wait' },
        { title: '任务完成', status: 'wait' },
      ],
    })

    try {
      // 第一步：接受任务
      const response: any = await acceptTask(task.id, task.opportunityId, account?.id)
      if (response && response.code === 0 && response.data.id) {
        // 更新进度：第一步完成，开始第二步
        setTaskProgress(prev => ({
          ...prev,
          currentStep: 1,
          steps: [
            { title: t('acceptingTask' as any), status: 'finish' },
            { title: t('publishingTask' as any), status: 'processing' },
            { title: t('submittingTask' as any), status: 'wait' },
            { title: t('taskCompleted' as any), status: 'wait' },
          ],
        }))

        // 第二步：发布任务
        const publishAccount = account || getAccountById(task.accountId)
        if (publishAccount) {
          // 使用选中的素材
          const material = selectedMaterial

          // 处理媒体内容
          const videos = material.mediaList?.filter((m: any) => m.type === 'video') || []
          const images = material.mediaList?.filter((m: any) => m.type !== 'video') || []

          const publishData = {
            flowId: `${publishAccount.uid}_${generateUUID()}`, // 使用账号的uid作为flowId
            accountType: publishAccount.type,
            accountId: publishAccount.id,
            title: material.title || task.title,
            desc: material.desc || task.description,
            type: 'article' as any, // 固定为 article 类型
            // 处理素材数据
            videoUrl: videos.length > 0 ? getOssUrl(videos[0].url) : undefined,
            coverUrl: material.coverUrl ? getOssUrl(material.coverUrl) : undefined,
            imgUrlList: images.map((img: any) => getOssUrl(img.url)),
            option: {},
            topics: [],
            publishTime: getUtcDays(getDays().add(6, 'minute')).format(),
            userTaskId: response.data.id,
            taskMaterialId: material._id, // 使用选中素材的ID
          }

          const publishResponse: any = await apiCreatePublish(publishData)

          console.log('publishResponse', publishResponse)
          // return false;

          if (publishResponse && publishResponse.code === 0) {
            // 更新进度：第二步完成，开始第三步
            setTaskProgress(prev => ({
              ...prev,
              currentStep: 2,
              steps: [
                { title: t('acceptingTask' as any), status: 'finish' },
                { title: t('publishingTask' as any), status: 'finish' },
                { title: t('submittingTask' as any), status: 'processing' },
                { title: t('taskCompleted' as any), status: 'wait' },
              ],
            }))

            // 第三步：提交任务
            const userTaskId = response.data.id
            const submitResponse: any = await submitTask(userTaskId, material._id)

            if (submitResponse && submitResponse.code === 0) {
              // 更新进度：第三步完成，开始第四步
              setTaskProgress(prev => ({
                ...prev,
                currentStep: 3,
                steps: [
                  { title: t('acceptingTask' as any), status: 'finish' },
                  { title: t('publishingTask' as any), status: 'finish' },
                  { title: t('submittingTask' as any), status: 'finish' },
                  { title: t('taskCompleted' as any), status: 'finish' },
                ],
              }))

              // 延迟1秒后关闭进度窗口并刷新任务列表
              setTimeout(() => {
                setTaskProgressVisible(false)
                setTaskDetail(null)
                fetchPendingTasks()
                fetchAcceptedTasks()
                setActiveTab('accepted')
              }, 1000)
            }
            else {
              throw new Error('提交任务失败')
            }
          }
          else {
            throw new Error('发布任务失败')
          }
        }
        else {
          throw new Error('找不到发布账号信息')
        }
      }
      else {
        throw new Error('接受任务失败')
      }
    }
    catch (error) {
      console.error('任务处理失败:', error)
      toast.error('任务处理失败')
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
      // 更新进度：第一步完成，开始第二步
      setTaskProgress(prev => ({
        ...prev,
        currentStep: 1,
        steps: [
          { title: '正在完成任务...', status: 'finish' },
          { title: '正在发布任务...', status: 'processing' },
          { title: '正在提交任务...', status: 'wait' },
          { title: '任务完成', status: 'wait' },
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
          // 更新进度：第二步完成，开始第三步
          setTaskProgress(prev => ({
            ...prev,
            currentStep: 2,
            steps: [
              { title: '正在完成任务...', status: 'finish' },
              { title: '正在发布任务...', status: 'finish' },
              { title: '正在提交任务...', status: 'processing' },
              { title: '任务完成', status: 'wait' },
            ],
          }))

          // 第三步：提交任务
          const userTaskId = acceptedTaskDetail.id
          const submitResponse: any = await submitTask(userTaskId, acceptedTaskDetail.task?.materialIds[0])

          if (submitResponse && submitResponse.code === 0) {
            // 更新进度：第三步完成，开始第四步
            setTaskProgress(prev => ({
              ...prev,
              currentStep: 3,
              steps: [
                { title: '正在完成任务...', status: 'finish' },
                { title: '正在发布任务...', status: 'finish' },
                { title: '正在提交任务...', status: 'finish' },
                { title: '任务完成', status: 'finish' },
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
            throw new Error('提交任务失败')
          }
        }
        else {
          throw new Error('发布任务失败')
        }
      }
      else {
        throw new Error('找不到发布账号信息')
      }
    }
    catch (error) {
      console.error('任务处理失败:', error)
      toast.error('任务处理失败')
      setTaskProgressVisible(false)
    }
  }

  // 处理待接受任务分页变化
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

  return (
    <div className={styles.taskPage}>
      {/* <div className={styles.header}>
        <h1>任务中心</h1>
        <p>接受任务，完成任务，获得奖励</p>
      </div> */}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane
          tab={(
            <span>
              <ClockCircleOutlined />
              &nbsp;
              {' '}
              {t('pendingTasks')}
            </span>
          )}
          key="pending"
        >
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
                                ? `${task.accountTypes.map((type: string) => getPlatformName(type)).join('、')}任务`
                                : `${getPlatformName(task.accountType)}任务`}
                            </h3>
                          </div>
                          <Tag color="orange">{t('taskStatus.pending' as any)}</Tag>
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
                                alt="账号头像"
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
                            type="primary"
                            onClick={() => handleViewTaskDetail(task.id)}
                            icon={<EyeOutlined />}
                            style={{ width: '100%' }}
                          >
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
        </TabPane>

        <TabPane
          tab={(
            <span>
              <PlayCircleOutlined />
              &nbsp;
              {' '}
              {t('acceptedTasks')}
            </span>
          )}
          key="accepted"
        >
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
                          <Tag color={getTaskStatusTag(task.status).color}>
                            {getTaskStatusTag(task.status).text}
                          </Tag>
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
                                alt="账号头像"
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
                            type="primary"
                            onClick={() => handleViewAcceptedTaskDetail(task.id)}
                            icon={<EyeOutlined />}
                            style={{ width: '100%' }}
                          >
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
        </TabPane>
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
          setDraftSource('task')
        }}
        footer={null}
        width={1200}
        zIndex={15}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px',
          },
          body: {
            padding: '24px',
          },
        }}
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
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>{t('draft.selectDraft')}</span>
                    <Radio.Group
                      value={draftSource}
                      onChange={(e) => {
                        setDraftSource(e.target.value)
                        if (e.target.value === 'own') {
                          setDraftModalOpen(true)
                        }
                      }}
                    >
                      <Radio value="task">{t('draft.taskDraft')}</Radio>
                      <Radio value="own">{t('draft.myDraft')}</Radio>
                    </Radio.Group>
                  </div>
                  {draftSource === 'own' && selectedMaterial && (
                    <Button
                      type="link"
                      onClick={() => setDraftModalOpen(true)}
                    >
                      {t('draft.reselect')}
                    </Button>
                  )}
                </div>

                {/* 任务草稿列表 */}
                {draftSource === 'task' && (
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
                              onClick={() => setSelectedMaterial(material)}
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
                                  {material.title || 'no title'}
                                </div>
                                <div style={{
                                  fontSize: '12px',
                                  color: '#999',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                >
                                  {material.desc || 'no description'}
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
                      <Empty description="no draft material" />
                    )}
                  </Spin>
                )}

                {/* 我的草稿选择结果 */}
                {draftSource === 'own' && selectedMaterial && (
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
                            fill
                            sizes="120px"
                            style={{
                              objectFit: 'cover',
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

                {draftSource === 'own' && !selectedMaterial && (
                  <Empty description={t('draft.pleaseSelectDraft')} />
                )}
              </div>

              {/* 底部按钮 */}
              {taskDetail.status === 'active' && taskDetail.currentRecruits < taskDetail.maxRecruits && (
                <div style={{
                  textAlign: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #e8e8e8',
                }}
                >
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => handleTaskAction(taskDetail)}
                    disabled={!selectedMaterial}
                  >
                    {t('acceptTask')}
                  </Button>
                  {!selectedMaterial && (
                    <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '12px' }}>
                      {t('draft.pleaseSelectDraftMaterial')}
                    </div>
                  )}
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

      {/* DraftSelectionModal 用于选择自己的草稿 */}
      <DraftSelectionModal
        draftModalOpen={draftModalOpen}
        onCancel={() => {
          setDraftModalOpen(false)
          // 如果取消选择且当前选择的是自己的草稿，切换回任务草稿
          if (draftSource === 'own' && !selectedMaterial) {
            setDraftSource('task')
          }
        }}
        onSelectDraft={(draft) => {
          setSelectedMaterial(draft)
          setDraftSource('own')
        }}
      />

      {/* 已接受任务详情弹窗 */}
      <Modal
        title={t('taskDetails')}
        open={acceptedTaskDetailModalVisible}
        onCancel={() => {
          setAcceptedTaskDetailModalVisible(false)
          setAcceptedTaskDetail(null)
        }}
        footer={[

        ]}
        width={800}
        zIndex={2000}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px',
          },
          body: {
            padding: '24px',
          },
        }}
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
                              onClick={() => handleVideoCoverClick(acceptedTaskMaterialList[0].mediaList[0], acceptedTaskDetail.task.title)}
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
                              onClick={() => handleMediaClick(acceptedTaskMaterialList[0].mediaList[0], acceptedTaskDetail.task.title)}
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
                        接受时间
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
                        提交时间
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#495057',
                      }}
                      >
                        {acceptedTaskDetail.submissionTime ? formatTime(acceptedTaskDetail.submissionTime) : '未提交'}
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
                  <Tag
                    color={getTaskStatusTag(acceptedTaskDetail.status).color}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                    }}
                  >
                    {getTaskStatusTag(acceptedTaskDetail.status).text}
                  </Tag>
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                  }}
                  >
                    {acceptedTaskDetail.status === 'doing'
                      ? 'task pending'
                      : acceptedTaskDetail.status === 'pending'
                        ? 'task completed'
                        : `task status: ${acceptedTaskDetail.status}`}
                  </span>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#999',
                }}
                >
                  {acceptedTaskDetail.isFirstTimeSubmission && (
                    <span style={{ color: '#52c41a' }}>first submission</span>
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
                        type="primary"
                        size="large"
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
        afterClose={handleCloseMediaPreview}
        footer={[
          <Button key="close" onClick={handleCloseMediaPreview}>
            {t('modal.close')}
          </Button>,
        ]}
        width={previewMedia?.type === 'video' ? 800 : 600}
        zIndex={3000}
        destroyOnHidden={true}
        styles={{
          body: {
            padding: '24px',
            textAlign: 'center',
          },
        }}
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

      {/* 任务进度弹窗 */}
      <Modal
        title={t('taskProcessing')}
        open={taskProgressVisible}
        closable={false}
        maskClosable={false}
        footer={null}
        width={500}
        zIndex={3000}
        styles={{
          body: {
            padding: '24px',
          },
        }}
      >
        <Steps
          direction="vertical"
          current={taskProgress.currentStep}
          items={taskProgress.steps.map((step, index) => ({
            title: step.title,
            status: step.status as 'wait' | 'process' | 'finish' | 'error',
            description: index === 0
              ? (step.title.includes(t('completeTask' as any)) ? t('messages.taskProcessFailed') : t('messages.taskProcessFailed'))
              : index === 1
                ? t('messages.taskProcessFailed')
                : index === 2
                  ? t('messages.taskProcessFailed')
                  : t('messages.taskProcessFailed'),
          }))}
        />
      </Modal>

      {/* 账号选择弹窗 */}
      <Modal
        title={t('accountSelect.title' as any)}
        open={accountSelectVisible}
        onCancel={() => setAccountSelectVisible(false)}
        footer={null}
        width={600}
        zIndex={2500}
        styles={{
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px',
          },
          body: {
            padding: '24px',
          },
        }}
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
                    alt="账号头像"
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
                    <Tag color="blue">{getPlatformName(account.type)}</Tag>
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
                        nickname:
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
    </div>
  )
}
