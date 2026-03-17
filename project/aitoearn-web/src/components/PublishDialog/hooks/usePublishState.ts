/**
 * 发布弹框本地状态管理
 * 管理弹框内各种临时状态，如 loading、弹窗显示状态等
 */

import { useCallback, useState } from 'react'

export interface PublishModalState {
  // 创建发布loading
  createLoading: boolean
  setCreateLoading: (loading: boolean) => void
  // 下载App弹窗
  downloadModalVisible: boolean
  setDownloadModalVisible: (visible: boolean) => void
  currentPlatform: string
  setCurrentPlatform: (platform: string) => void
  // 抖音扫码发布弹窗
  douyinQRCodeVisible: boolean
  setDouyinQRCodeVisible: (visible: boolean) => void
  douyinPermalink: string
  setDouyinPermalink: (permalink: string) => void
  // Facebook页面选择弹窗
  showFacebookPagesModal: boolean
  setShowFacebookPagesModal: (show: boolean) => void
  // 发布详情弹框
  publishDetailVisible: boolean
  setPublishDetailVisible: (visible: boolean) => void
  currentPublishTaskId: string | undefined
  setCurrentPublishTaskId: (taskId: string | undefined) => void
}

/**
 * 管理发布弹框内各种弹窗的显示状态
 */
export function usePublishModalState(): PublishModalState {
  // 创建发布loading
  const [createLoading, setCreateLoading] = useState(false)
  // 下载App弹窗状态
  const [downloadModalVisible, setDownloadModalVisible] = useState(false)
  const [currentPlatform, setCurrentPlatform] = useState<string>('')
  // 抖音扫码发布弹窗状态
  const [douyinQRCodeVisible, setDouyinQRCodeVisible] = useState(false)
  const [douyinPermalink, setDouyinPermalink] = useState('')
  // Facebook页面选择弹窗状态
  const [showFacebookPagesModal, setShowFacebookPagesModal] = useState(false)
  // 发布详情弹框状态
  const [publishDetailVisible, setPublishDetailVisible] = useState(false)
  const [currentPublishTaskId, setCurrentPublishTaskId] = useState<string | undefined>(undefined)

  return {
    createLoading,
    setCreateLoading,
    downloadModalVisible,
    setDownloadModalVisible,
    currentPlatform,
    setCurrentPlatform,
    douyinQRCodeVisible,
    setDouyinQRCodeVisible,
    douyinPermalink,
    setDouyinPermalink,
    showFacebookPagesModal,
    setShowFacebookPagesModal,
    publishDetailVisible,
    setPublishDetailVisible,
    currentPublishTaskId,
    setCurrentPublishTaskId,
  }
}

/**
 * 关闭发布详情弹框
 */
export function usePublishDetailModalActions(
  setPublishDetailVisible: (visible: boolean) => void,
  setCurrentPublishTaskId: (taskId: string | undefined) => void,
) {
  const closePublishDetailModal = useCallback(() => {
    setPublishDetailVisible(false)
    setCurrentPublishTaskId(undefined)
  }, [setPublishDetailVisible, setCurrentPublishTaskId])

  return { closePublishDetailModal }
}
