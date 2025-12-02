/**
 * 发布详情弹框组件
 * 显示单次发布任务中多个平台的详细进度
 */

'use client'

import type { PlatformPublishTask, PluginPlatformType, PublishTask } from '../types/baseTypes'
import { CloseOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Modal, Progress, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
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

  return (
    <div className={styles.platformCard}>
      {/* 平台信息 */}
      <div className={styles.platformCard_header}>
        <div className={styles.platform}>
          <span className={styles.platformName}>
            {getPlatformName(platformTask.platform as PluginPlatformType)}
          </span>
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
  const getPublishTask = usePluginStore(state => state.getPublishTask)
  const [currentTask, setCurrentTask] = useState<PublishTask | undefined>(task)

  // 如果传入 taskId，从 store 中获取任务
  useEffect(() => {
    if (taskId && getPublishTask) {
      const foundTask = getPublishTask(taskId)
      setCurrentTask(foundTask)
    }
    else if (task) {
      setCurrentTask(task)
    }
  }, [taskId, task, getPublishTask])

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
                key={platformTask.platform}
                platformTask={platformTask}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
