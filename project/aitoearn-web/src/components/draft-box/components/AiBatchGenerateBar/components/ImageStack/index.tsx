/**
 * ImageStack - 图片/视频堆叠组件
 * 折叠态：卡牌堆叠（大旋转角度、竖长方形 3:4 比例），右下角 "+" 按钮
 * 展开态（hover）：纯 transform 驱动平滑水平排列，hover 显示 X 删除按钮
 * 移动端：flex-wrap 网格布局，始终展开，X 按钮始终显示
 */

'use client'

import type { ImageStackProps } from './types'
import { memo, useCallback } from 'react'
import { MediaPreview } from '@/components/common/MediaPreview'
import { DesktopImageStack } from './components/DesktopImageStack'
import { MobileImageStack } from './components/MobileImageStack'
import { useImageStackLayout } from './hooks/useImageStackLayout'
import { useImageStackPreview } from './hooks/useImageStackPreview'
import { useImageStackRemoval } from './hooks/useImageStackRemoval'
import { useIsImageStackMobile } from './hooks/useIsImageStackMobile'
import { useVideoInfoMap } from './hooks/useVideoInfoMap'

export type { ImageStackProps } from './types'

const ImageStack = memo(
  ({
    localMedias,
    onLocalMediaRemove,
    onLocalUpload,
    canUploadImage,
    canUploadVideo,
    canUploadAudio,
    accept,
  }: ImageStackProps) => {
    const isMobile = useIsImageStackMobile()
    const totalMediaCount = localMedias.length
    const showAddButton = canUploadImage || canUploadVideo || canUploadAudio
    const layout = useImageStackLayout({ totalMediaCount, showAddButton })
    const videoInfoMap = useVideoInfoMap(localMedias)
    const { previewOpen, previewItems, setPreviewOpen, handleMediaClick } = useImageStackPreview()
    const handleLastMediaRemoved = useCallback(() => {
      layout.clearCollapseTimer()
      layout.setExpanded(false)
    }, [layout])
    const { exitingKeys, handleDeleteLocalMedia } = useImageStackRemoval({
      localMedias,
      onLocalMediaRemove,
      onLastMediaRemoved: handleLastMediaRemoved,
    })

    return (
      <>
        {isMobile ? (
          <MobileImageStack
            localMedias={localMedias}
            showAddButton={showAddButton}
            accept={accept}
            videoInfoMap={videoInfoMap}
            exitingKeys={exitingKeys}
            onLocalUpload={onLocalUpload}
            onDelete={handleDeleteLocalMedia}
            onPreview={handleMediaClick}
          />
        ) : (
          <DesktopImageStack
            localMedias={localMedias}
            showAddButton={showAddButton}
            accept={accept}
            totalMediaCount={totalMediaCount}
            layout={layout}
            videoInfoMap={videoInfoMap}
            exitingKeys={exitingKeys}
            onLocalUpload={onLocalUpload}
            onDelete={handleDeleteLocalMedia}
            onPreview={handleMediaClick}
          />
        )}
        <MediaPreview
          open={previewOpen}
          items={previewItems}
          onClose={() => setPreviewOpen(false)}
        />
      </>
    )
  },
)

ImageStack.displayName = 'ImageStack'

export default ImageStack
