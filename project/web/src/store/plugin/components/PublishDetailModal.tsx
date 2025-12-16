/**
 * 发布详情弹框组件
 * 显示单次发布任务中多个平台的详细进度
 */

'use client'

import type { PlatformPublishTask, PluginPlatformType, PublishTask } from '../types/baseTypes'
import { CloseOutlined, LinkOutlined } from '@ant-design/icons'
import { Avatar, Button, Progress, Tag } from 'antd'
import dayjs from 'dayjs'
import { Modal } from '@/components/ui/modal'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { useAccountStore } from '@/store/account'
import { getOssUrl } from '@/utils/oss'
import { usePluginStore } from '../store'
import { PlatformTaskStatus } from '../types/baseTypes'
import styles from './PublishDetailModal.module.scss'

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
 * 获取状态对应的标签颜色
 */
function getStatusColor(status: PlatformTaskStatus): string {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'success'
    case PlatformTaskStatus.PUBLISHING:
      return 'processing'
    case PlatformTaskStatus.ERROR:
      return 'error'
    case PlatformTaskStatus.PENDING:
      return 'default'
    default:
      return 'default'
  }
}

/**
 * 获取进度条状态
 */
function getProgressStatus(status: PlatformTaskStatus): 'success' | 'exception' | 'active' | 'normal' {
  switch (status) {
    case PlatformTaskStatus.COMPLETED:
      return 'success'
    case PlatformTaskStatus.ERROR:
      return 'exception'
    case PlatformTaskStatus.PUBLISHING:
      return 'active'
    default:
      return 'normal'
  }
}

/**
 * 获取平台显示名称
 * @param platform 平台类型（PlatType）
 * @returns 平台显示名称
 */
function getPlatformName(platform: PluginPlatformType): string {
  const platInfo = AccountPlatInfoMap.get(platform)
  return platInfo?.name || platform
}

/**
 * 平台任务卡片组件
 */
function PlatformTaskCard({ platformTask }: { platformTask: PlatformPublishTask }) {
  const { t } = useTranslation('plugin')
  const accountMap = useAccountStore(state => state.accountMap)

  // 获取账号信息
  const account = platformTask.accountId ? accountMap.get(platformTask.accountId) : null
  const platInfo = AccountPlatInfoMap.get(platformTask.platform)

  return (
    <div className={styles.platformCard}>
      {/* 平台信息 - 包含账号头像 */}
      <div className={styles.platformCard_header}>
        <div className={styles.platform}>
          {/* 账号头像（带平台角标） */}
          <div className={styles.accountAvatar}>
            <Avatar
              src={account?.avatar ? getOssUrl(account.avatar) : undefined}
              size={40}
              style={{ backgroundColor: '#f0f0f0' }}
            >
              {account?.nickname?.charAt(0) || '?'}
            </Avatar>
            {/* 平台角标 */}
            {platInfo?.icon && (
              <div className={styles.platformBadge}>
                <Image src={platInfo.icon} alt={platInfo.name} width={16} height={16} />
              </div>
            )}
          </div>

          {/* 账号信息 */}
          <div className={styles.accountInfo}>
            <span className={styles.accountName} title={account?.nickname}>
              {account?.nickname || t('publishDetail.unknownAccount' as any)}
            </span>
            <span className={styles.platformName}>
              {getPlatformName(platformTask.platform as PluginPlatformType)}
            </span>
          </div>

          {/* 状态标签 */}
          <Tag color={getStatusColor(platformTask.status)}>
            {t(`common.${platformTask.status}`)}
          </Tag>
        </div>
      </div>

      {/* 进度信息 */}
      {platformTask.progress && (
        <div className={styles.platformCard_progress}>
          <Progress
            percent={Math.round(platformTask.progress.progress || 0)}
            status={getProgressStatus(platformTask.status)}
            strokeColor={{
              '0%': '#667eea',
              '100%': '#764ba2',
            }}
          />
          <div className={styles.progressInfo}>
            <span className={styles.stage}>
              {t(`stage.${platformTask.progress.stage}`)}
            </span>
            {platformTask.progress.message && (
              <span className={styles.message}>
                {platformTask.progress.message}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 结果信息 */}
      {platformTask.result && (
        <div className={styles.platformCard_result}>
          <div className={styles.resultTitle}>{t('publishDetail.result')}</div>
          {platformTask.result.workId && (
            <div className={styles.resultItem}>
              <span className={styles.label}>
                {t('publishDetail.workId')}
                :
              </span>
              <span className={styles.value}>{platformTask.result.workId}</span>
            </div>
          )}
          {platformTask.result.shareLink && (
            <div className={styles.resultItem}>
              <span className={styles.label}>
                {t('publishDetail.shareLink')}
                :
              </span>
              <a
                href={platformTask.result.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                <LinkOutlined />
                {' '}
                {t('common.viewLink')}
              </a>
            </div>
          )}
          {platformTask.result.failReason && (
            <div className={styles.resultItem}>
              <span className={styles.label}>
                {t('publishDetail.failReason')}
                :
              </span>
              <span className={styles.error}>{platformTask.result.failReason}</span>
            </div>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {platformTask.error && (
        <div className={styles.platformCard_error}>
          <div className={styles.errorTitle}>{t('common.error')}</div>
          <div className={styles.errorMessage}>{platformTask.error}</div>
        </div>
      )}

      {/* 时间信息 */}
      <div className={styles.platformCard_time}>
        {platformTask.startTime && (
          <div className={styles.timeItem}>
            <span className={styles.label}>
              {t('common.startTime')}
              :
            </span>
            <span className={styles.value}>
              {dayjs(platformTask.startTime).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </div>
        )}
        {platformTask.endTime && (
          <div className={styles.timeItem}>
            <span className={styles.label}>
              {t('common.endTime')}
              :
            </span>
            <span className={styles.value}>
              {dayjs(platformTask.endTime).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 发布详情弹框组件
 */
export function PublishDetailModal({ visible, onClose, taskId, task }: PublishDetailModalProps) {
  const { t } = useTranslation('plugin')

  // 订阅 store 中的任务列表，实现实时更新
  // 使用选择器直接获取目标任务，确保每次状态更新都能触发重新渲染
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
      title={(
        <div className={styles.modalHeader}>
          <span>{t('publishDetail.title')}</span>
          <Tag color={getStatusColor(currentTask.overallStatus)}>
            {t(`common.${currentTask.overallStatus}`)}
          </Tag>
        </div>
      )}
      open={visible}
      onCancel={onClose}
      footer={(
        <Button type="primary" onClick={onClose}>
          {t('publishDetail.close')}
        </Button>
      )}
      width={700}
      className={styles.publishDetailModal}
      closeIcon={<CloseOutlined />}
    >
      <div className={styles.publishDetailModal_content}>
        {/* 任务基本信息 */}
        <div className={styles.taskInfo}>
          <h3 className={styles.title}>{currentTask.title}</h3>
          {currentTask.description && (
            <p className={styles.description}>{currentTask.description}</p>
          )}
          <div className={styles.meta}>
            <span>
              {t('common.createdAt')}
              :
              {' '}
              {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </div>
        </div>

        {/* 平台任务列表 */}
        <div className={styles.platformTasks}>
          <h4 className={styles.sectionTitle}>
            {t('publishList.platforms')}
            {' '}
            (
            {currentTask.platformTasks.length}
            )
          </h4>
          <div className={styles.taskList}>
            {currentTask.platformTasks.map(platformTask => (
              <PlatformTaskCard
                key={platformTask.id}
                platformTask={platformTask}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
