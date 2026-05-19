/**
 * PluginPublishingFloatButton - global plugin publishing entry
 * Shows a floating entry while plugin publish tasks are running.
 */

'use client'

import type { PlatformPublishTask, PublishTask } from '@/store/plugin/types/baseTypes'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/shallow'
import { AccountPlatInfoMap } from '@/app/config/platConfig'
import { Button } from '@/components/ui/button'
import { notification } from '@/lib/notification'
import { cn } from '@/lib/utils'
import { usePluginStore } from '@/store/plugin'
import { PlatformTaskStatus, PLUGIN_SUPPORTED_PLATFORMS } from '@/store/plugin/types/baseTypes'
import { PublishDetailModal } from '../PublishDetailModal'
import styles from './PluginPublishingFloatButton.module.scss'

const notifiedPublishTaskIds = new Set<string>()

function isPluginPlatformTask(platformTask: PlatformPublishTask) {
  return PLUGIN_SUPPORTED_PLATFORMS.includes(platformTask.platform)
}

function isPublishingPluginPlatformTask(platformTask: PlatformPublishTask) {
  return isPluginPlatformTask(platformTask) && platformTask.status === PlatformTaskStatus.PUBLISHING
}

function hasPublishingPluginTask(task: PublishTask) {
  return task.platformTasks.some(isPublishingPluginPlatformTask)
}

function getPluginFinalStatus(task: PublishTask): 'success' | 'error' | null {
  const pluginTasks = task.platformTasks.filter(isPluginPlatformTask)
  if (pluginTasks.length === 0)
    return null

  const hasRunningTask = pluginTasks.some(platformTask => (
    platformTask.status === PlatformTaskStatus.PENDING
    || platformTask.status === PlatformTaskStatus.PUBLISHING
  ))
  if (hasRunningTask)
    return null

  if (pluginTasks.some(platformTask => platformTask.status === PlatformTaskStatus.ERROR))
    return 'error'

  return pluginTasks.every(platformTask => platformTask.status === PlatformTaskStatus.COMPLETED) ? 'success' : null
}

function getActivePlatformTask(task?: PublishTask) {
  return task?.platformTasks.find(isPublishingPluginPlatformTask)
}

export function PluginPublishingFloatButton() {
  const { t, ready } = useTranslation('plugin')
  const [detailVisible, setDetailVisible] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>()
  const taskStatusRef = useRef<Map<string, { notified: boolean, wasPublishing: boolean }>>(new Map())

  const { publishTasks, publishDetailModalOpenCount } = usePluginStore(
    useShallow(state => ({
      publishTasks: state.publishTasks,
      publishDetailModalOpenCount: state.publishDetailModalOpenCount,
    })),
  )

  const activePublishingTask = useMemo(
    () => publishTasks.find(hasPublishingPluginTask),
    [publishTasks],
  )
  const activePlatformTask = useMemo(
    () => getActivePlatformTask(activePublishingTask),
    [activePublishingTask],
  )
  const activePlatInfo = activePlatformTask
    ? AccountPlatInfoMap.get(activePlatformTask.platform)
    : undefined

  useEffect(() => {
    const nextTaskStatus = new Map<string, { notified: boolean, wasPublishing: boolean }>()

    publishTasks.forEach((task) => {
      const previousStatus = taskStatusRef.current.get(task.id)
      const isPublishing = hasPublishingPluginTask(task)
      const finalStatus = getPluginFinalStatus(task)
      const notified = previousStatus?.notified || false
      const finishedAfterPublishing = !!previousStatus?.wasPublishing && !!finalStatus
      const notificationKey = `plugin-publish-finished-${task.id}`
      const hasNotified = notified || notifiedPublishTaskIds.has(notificationKey)
      const shouldNotify = ready && finishedAfterPublishing && !hasNotified

      if (shouldNotify) {
        notifiedPublishTaskIds.add(notificationKey)
        const notify = finalStatus === 'success' ? notification.success : notification.error
        notify(finalStatus === 'success' ? t('publishFloating.completed') : t('publishFloating.failed'), {
          key: notificationKey,
          duration: 5,
        })
      }

      const nextNotified = hasNotified || shouldNotify || (!!finalStatus && !previousStatus)
      nextTaskStatus.set(task.id, {
        notified: nextNotified,
        wasPublishing: !nextNotified && (isPublishing || finishedAfterPublishing),
      })
    })

    taskStatusRef.current = nextTaskStatus
  }, [publishTasks, ready, t])

  useEffect(() => {
    if (!detailVisible || !activeTaskId)
      return

    const taskExists = publishTasks.some(task => task.id === activeTaskId)
    if (!taskExists) {
      setDetailVisible(false)
      setActiveTaskId(undefined)
    }
  }, [activeTaskId, detailVisible, publishTasks])

  const showButton = ready && !!activePublishingTask && publishDetailModalOpenCount === 0

  const handleOpenDetail = () => {
    if (!activePublishingTask)
      return

    setActiveTaskId(activePublishingTask.id)
    setDetailVisible(true)
  }

  const handleCloseDetail = () => {
    setDetailVisible(false)
    setActiveTaskId(undefined)
  }

  return (
    <>
      {showButton && (
        <Button
          type="button"
          className={cn(
            styles.floatButton,
            'h-auto border-0 bg-transparent p-0 shadow-none cursor-pointer hover:bg-transparent',
          )}
          variant="ghost"
          onClick={handleOpenDetail}
          aria-label={t('publishFloating.openDetail')}
        >
          <span className={styles.floatButton_wave} aria-hidden="true" />
          <span className={cn(styles.floatButton_wave, styles.floatButton_waveDelay)} aria-hidden="true" />
          <span className={styles.floatButton_glow} aria-hidden="true" />
          <span className={styles.floatButton_surface}>
            <span className={styles.floatButton_iconWrap}>
              {activePlatInfo?.icon ? (
                <Image src={activePlatInfo.icon} alt={activePlatInfo.name} width={24} height={24} />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin" />
              )}
              <span className={styles.floatButton_spinnerBadge}>
                <Loader2 className="h-3 w-3 animate-spin" />
              </span>
            </span>
            <span className={styles.floatButton_textWrap}>
              <span className={styles.floatButton_title}>{t('publishFloating.pluginPublishing')}</span>
              <span className={styles.floatButton_subtitle}>{t('publishFloating.openDetail')}</span>
            </span>
          </span>
        </Button>
      )}

      <PublishDetailModal
        visible={detailVisible}
        onClose={handleCloseDetail}
        taskId={activeTaskId}
      />
    </>
  )
}
