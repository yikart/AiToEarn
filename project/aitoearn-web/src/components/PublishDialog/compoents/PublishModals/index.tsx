/**
 * 发布弹框相关的模态框组件集合
 * 包含 Facebook 页面选择、抖音扫码、发布详情等弹窗
 */

import { memo } from 'react'
import { PublishDetailModal } from '@/components/Plugin'
import { DouyinQRCodeModal } from '@/components/PublishDialog/compoents/DouyinQRCodeModal'
import FacebookPagesModal from './FacebookPagesModal'

interface PublishModalsProps {
  // Facebook页面选择弹窗
  showFacebookPagesModal: boolean
  setShowFacebookPagesModal: (show: boolean) => void
  onFacebookPagesSuccess: () => void
  // 抖音扫码弹窗
  douyinQRCodeVisible: boolean
  setDouyinQRCodeVisible: (visible: boolean) => void
  douyinPermalink: string
  // 发布详情弹框
  publishDetailVisible: boolean
  onPublishDetailClose: () => void
  currentPublishTaskId: string | undefined
  // 发布完成后是否自动关闭弹框
  autoCloseOnComplete?: boolean
}

/**
 * 发布弹框相关的模态框组件集合
 */
export const PublishModals = memo(
  ({
    showFacebookPagesModal,
    setShowFacebookPagesModal,
    onFacebookPagesSuccess,
    douyinQRCodeVisible,
    setDouyinQRCodeVisible,
    douyinPermalink,
    publishDetailVisible,
    onPublishDetailClose,
    currentPublishTaskId,
    autoCloseOnComplete,
  }: PublishModalsProps) => {
    return (
      <>
        {/* Facebook页面选择弹窗 */}
        <FacebookPagesModal
          open={showFacebookPagesModal}
          onClose={() => setShowFacebookPagesModal(false)}
          onSuccess={onFacebookPagesSuccess}
        />

        {/* 抖音扫码发布弹窗 */}
        <DouyinQRCodeModal
          open={douyinQRCodeVisible}
          permalink={douyinPermalink}
          onClose={() => setDouyinQRCodeVisible(false)}
        />

        {/* 发布详情弹框 - 显示插件发布进度 */}
        <PublishDetailModal
          visible={publishDetailVisible}
          onClose={onPublishDetailClose}
          taskId={currentPublishTaskId}
          autoCloseOnComplete={autoCloseOnComplete}
        />
      </>
    )
  },
)

PublishModals.displayName = 'PublishModals'

export default PublishModals
