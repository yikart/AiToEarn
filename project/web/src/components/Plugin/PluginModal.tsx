/**
 * PluginModal - 插件状态主弹框组件
 * 根据插件状态显示不同内容：未安装、未授权、已就绪
 */

'use client'

import type { PublishTask } from '@/store/plugin/types/baseTypes'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/modal'
import { usePluginStore } from '@/store/plugin'
import { PluginStatus } from '@/store/plugin/types/baseTypes'
import { PluginNoPermission } from './PluginNoPermission'
import { PluginNotInstalled } from './PluginNotInstalled'
import { PluginReady } from './PluginReady'
import { PublishDetailModal } from './PublishDetailModal'

/**
 * 组件属性
 */
export interface PluginModalProps {
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 需要高亮的平台 */
  highlightPlatform?: string | null
}

/**
 * 插件状态主弹框组件
 */
export function PluginModal({ visible, onClose, highlightPlatform }: PluginModalProps) {
  const { t } = useTranslation('plugin')
  const status = usePluginStore(state => state.status)

  const [showDetail, setShowDetail] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PublishTask | null>(null)

  // 状态判断
  const isReady = status === PluginStatus.READY
  const isInstalledNoPermission = status === PluginStatus.INSTALLED_NO_PERMISSION
  const isNotInstalled = status === PluginStatus.NOT_INSTALLED || status === PluginStatus.UNKNOWN

  /**
   * 获取弹框标题
   */
  const getModalTitle = () => {
    if (isReady)
      return t('status.ready')
    if (isInstalledNoPermission)
      return t('status.installedNoPermission')
    return t('status.notInstalled')
  }

  /**
   * 获取弹框宽度
   */
  const getModalWidth = () => {
    return isReady ? 680 : 480
  }

  /**
   * 处理查看任务详情
   */
  const handleViewDetail = (task: PublishTask) => {
    setSelectedTask(task)
    setShowDetail(true)
  }

  /**
   * 渲染内容
   */
  const renderContent = () => {
    if (isReady) {
      return (
        <PluginReady
          highlightPlatform={highlightPlatform}
          onViewDetail={handleViewDetail}
        />
      )
    }

    if (isInstalledNoPermission) {
      return <PluginNoPermission />
    }

    return <PluginNotInstalled />
  }

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        title={getModalTitle()}
        footer={null}
        width={getModalWidth()}
        centered
      >
        {renderContent()}
      </Modal>

      {/* 发布详情弹框 */}
      <PublishDetailModal
        visible={showDetail}
        onClose={() => {
          setShowDetail(false)
          setSelectedTask(null)
        }}
        task={selectedTask || undefined}
      />
    </>
  )
}
