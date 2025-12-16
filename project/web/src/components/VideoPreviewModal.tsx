/**
 * VideoPreviewModal - 视频预览弹窗
 * 用于在弹窗中预览视频内容
 */

import type { ForwardedRef } from 'react'
import { forwardRef, memo, useRef } from 'react'
import { useTransClient } from '@/app/i18n/client'
import { Modal } from '@/components/ui/modal'

export interface IVideoPreviewModalRef {}

export interface IVideoPreviewModalProps {
  open: boolean
  videoUrl?: string
  onCancel: () => void
}

const VideoPreviewModal = memo(
  forwardRef(
    (
      { open, videoUrl, onCancel }: IVideoPreviewModalProps,
      ref: ForwardedRef<IVideoPreviewModalRef>,
    ) => {
      const videoRef = useRef<HTMLVideoElement>(null)
      const { t } = useTransClient('publish')

      return (
        <Modal
          title={t('previewvideo')}
          open={open}
          footer={null}
          onCancel={() => {
            if (videoRef.current) {
              videoRef.current.pause()
            }
            onCancel()
          }}
          width={720}
        >
          <video
            ref={videoRef}
            controls
            style={{ width: '100%', maxHeight: '80vh' }}
            src={videoUrl}
          />
        </Modal>
      )
    },
  ),
)

export default VideoPreviewModal
