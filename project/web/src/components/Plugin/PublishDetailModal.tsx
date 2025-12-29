/**
 * PublishDetailModal - 发布详情弹框组件
 * 显示单次发布任务中多个平台的详细进度
 */

'use client'

import type { PlatformPublishTask, PluginPlatformType, PublishTask } from '@/store/plugin/types/baseTypes'
import dayjs from 'dayjs'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/store/account'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus } from '@/store/plugin/types/baseTypes'
import { getOssUrl } from '@/utils/oss'

/**
 * 组件属性
 */
export interface PublishDetailModalProps {
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 任务ID（二选一） */
  taskId?: string
  /** 任务对象（二选一） */
  task?: PublishTask
}

/**
 * 获取平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 获取状态 Badge 类名
 */
function getStatusClassName(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-green-100 text-green-700'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-blue-100 text-blue-700'
    case PlatformTaskStatus.ERROR:
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * 获取进度条颜色
 */
function getProgressColor(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'bg-green-500'
    case PlatformTaskStatus.ERROR:
      return 'bg-red-500'
    case PlatformTaskStatus.PUBLISHING:
      return 'bg-blue-500'
    default:
      return 'bg-gray-300'
  }
}

/**
 * 平台任务卡片组件
 */
function PlatformTaskCard({ platformTask }: { platformTask: PlatformPublishTask }) {
  const { t } = useTranslation('plugin')
  const accountMap = useAccountStore(state => state.accountMap)

  const account = platformTask.accountId ? accountMap.get(platformTask.accountId) : null
  const platInfo = AccountPlatInfoMap.get(platformTask.platform)
  const progress = platformTask.progress?.progress || 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* 头部：账号信息 + 状态 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 头像（带平台角标） */}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={account?.avatar ? getOssUrl(account.avatar) : undefined} />
              <AvatarFallback className="bg-gray-100 text-gray-500">
                {account?.nickname?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {platInfo?.icon && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 overflow-hidden rounded-full border-2 border-white bg-white">
                <Image src={platInfo.icon} alt={platInfo.name} width={20} height={20} />
              </div>
            )}
          </div>

          {/* 账号名称 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {account?.nickname || t('publishDetail.unknownAccount' as any)}
            </span>
            <span className="text-xs text-gray-500">
              {getPlatformName(platformTask.platform as PluginPlatformType)}
            </span>
          </div>
        </div>

        {/* 状态标签 */}
        <Badge className={cn('shrink-0', getStatusClassName(platformTask.status))}>
          {t(`common.${platformTask.status}`)}
        </Badge>
      </div>

      {/* 进度条 */}
      {platformTask.progress && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-500">{t(`stage.${platformTask.progress.stage}`)}</span>
            <span className="text-gray-400">
              {Math.round(progress)}
              %
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn('h-full rounded-full transition-all', getProgressColor(platformTask.status))}
              style={{ width: `${progress}%` }}
            />
          </div>
          {platformTask.progress.message && (
            <p className="mt-1 text-xs text-gray-400">{platformTask.progress.message}</p>
          )}
        </div>
      )}

      {/* 结果信息 */}
      {platformTask.result && (
        <div className="space-y-1 border-t border-gray-100 pt-3">
          {platformTask.result.workId && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">
                {t('publishDetail.workId')}
                :
              </span>
              <span className="text-gray-700">{platformTask.result.workId}</span>
            </div>
          )}
          {platformTask.result.shareLink && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">
                {t('publishDetail.shareLink')}
                :
              </span>
              <a
                href={platformTask.result.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
              >
                <ExternalLink className="h-3 w-3" />
                {t('common.viewLink')}
              </a>
            </div>
          )}
          {platformTask.result.failReason && (
            <div className="flex items-start gap-2 text-xs">
              <span className="shrink-0 text-gray-500">
                {t('publishDetail.failReason')}
                :
              </span>
              <span className="text-red-600">{platformTask.result.failReason}</span>
            </div>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {platformTask.error && !platformTask.result?.failReason && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-red-600">{platformTask.error}</p>
        </div>
      )}

      {/* 时间信息 */}
      {(platformTask.startTime || platformTask.endTime) && (
        <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
          {platformTask.startTime && (
            <span>
              {t('common.startTime')}
              :
              {dayjs(platformTask.startTime).format('HH:mm:ss')}
            </span>
          )}
          {platformTask.endTime && (
            <span>
              {t('common.endTime')}
              :
              {dayjs(platformTask.endTime).format('HH:mm:ss')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 发布详情弹框组件
 */
export function PublishDetailModal({ visible, onClose, taskId, task }: PublishDetailModalProps) {
  const { t } = useTranslation('plugin')

  // 从 store 获取任务（支持实时更新）
  const currentTask = usePluginStore((state) => {
    if (taskId) {
      return state.publishTasks.find(t => t.id === taskId)
    }
    return task
  })

  if (!currentTask) {
    return null
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={(
        <div className="flex items-center gap-3">
          <span>{t('publishDetail.title')}</span>
          <Badge className={getStatusClassName(currentTask.overallStatus)}>
            {t(`common.${currentTask.overallStatus}`)}
          </Badge>
        </div>
      )}
      footer={(
        <Button onClick={onClose}>
          {t('publishDetail.close')}
        </Button>
      )}
      width={600}
    >
      <div className="space-y-4">
        {/* 任务基本信息 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="mb-1 font-medium text-gray-900">
            {currentTask.title || t('publishList.untitled' as any)}
          </h3>
          {currentTask.description && (
            <p className="mb-2 text-sm text-gray-500">{currentTask.description}</p>
          )}
          <div className="text-xs text-gray-400">
            {t('common.createdAt')}
            :
            {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        </div>

        {/* 平台任务列表 */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700">
            {t('publishList.platforms')}
            {' '}
            (
            {currentTask.platformTasks.length}
            )
          </h4>
          <div className="space-y-3">
            {currentTask.platformTasks.map(platformTask => (
              <PlatformTaskCard key={platformTask.id} platformTask={platformTask} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
