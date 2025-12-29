'use client'

/**
 * 媒体区域组件
 * - 图片轮播（使用 Swiper）
 * - 视频播放（自动播放）
 * - 图片预览（使用 Ant Design Image.PreviewGroup）
 */

import type { Swiper as SwiperType } from 'swiper'
import { Image } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { getImageList, getVideoInfo, useDetailModalStore } from '../../store/detailStore'

// Swiper 样式
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

/**
 * 媒体区域组件
 */
function MediaSection() {
  const {
    detail,
    preview,
    currentImageIndex,
    imagePreviewVisible,
    setCurrentImageIndex,
    openImagePreview,
    closeImagePreview,
  } = useDetailModalStore()

  // 视频引用
  const videoRef = useRef<HTMLVideoElement>(null)

  // Swiper 引用
  const swiperRef = useRef<SwiperType | null>(null)

  // 图片加载完成状态
  const [imageLoaded, setImageLoaded] = useState(false)

  // 获取图片列表
  const imageList = useMemo(() => getImageList(detail, preview), [detail, preview])

  // 获取视频信息
  const videoInfo = useMemo(() => getVideoInfo(detail), [detail])

  // 是否是视频
  const isVideo = detail?.type === 'video' || preview?.isVideo

  // 封面图（始终保持稳定，优先使用预览图）
  const coverUrl = preview?.thumbnail || detail?.coverUrl || ''

  // 视频自动播放
  useEffect(() => {
    if (isVideo && videoInfo?.url && videoRef.current) {
      videoRef.current.play().catch(() => {
        // 自动播放被阻止，忽略错误
      })
    }
  }, [isVideo, videoInfo])

  // 同步 Swiper 索引
  useEffect(() => {
    if (swiperRef.current && swiperRef.current.activeIndex !== currentImageIndex) {
      swiperRef.current.slideTo(currentImageIndex)
    }
  }, [currentImageIndex])

  // 重置加载状态当图片列表变化时
  useEffect(() => {
    if (imageList.length > 1) {
      // 多图模式，等待 Swiper 初始化
      setImageLoaded(true)
    }
  }, [imageList.length])

  /**
   * Swiper 切换回调
   */
  const handleSlideChange = (swiper: SwiperType) => {
    setCurrentImageIndex(swiper.activeIndex)
  }

  /**
   * 点击图片打开预览
   */
  const handleImageClick = () => {
    if (!isVideo && imageList.length > 0) {
      openImagePreview(currentImageIndex)
    }
  }

  /**
   * 图片加载完成
   */
  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div className="feedDetailModal_media">
      {/* 视频播放 */}
      {isVideo && videoInfo?.url ? (
        <video
          ref={videoRef}
          src={videoInfo.url}
          className="feedDetailModal_media_video"
          controls
          autoPlay
          playsInline
          poster={coverUrl}
        />
      ) : (
        <>
          {/* 底层：封面占位图（防止闪烁） */}
          <div className="feedDetailModal_media_placeholder">
            <img src={coverUrl} alt="Cover" />
          </div>

          {/* 图片预览组件 - 支持多图预览 */}
          <Image.PreviewGroup
            preview={{
              visible: imagePreviewVisible,
              onVisibleChange: (visible) => {
                if (visible) {
                  openImagePreview()
                }
                else {
                  closeImagePreview()
                }
              },
              current: currentImageIndex,
              onChange: setCurrentImageIndex,
            }}
            items={imageList}
          >
            {/* 上层：实际图片内容（带淡入效果） */}
            <div
              className={`feedDetailModal_media_content ${imageLoaded ? 'feedDetailModal_media_content-loaded' : ''}`}
            >
              {imageList.length > 1 ? (
                // 多图轮播
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{
                    clickable: true,
                    dynamicBullets: true,
                  }}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper
                  }}
                  onSlideChange={handleSlideChange}
                  className="feedDetailModal_media_swiper"
                >
                  {imageList.map((url, index) => (
                    <SwiperSlide key={url}>
                      <div className="feedDetailModal_media_slideWrapper" onClick={handleImageClick}>
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="feedDetailModal_media_img"
                          preview={false}
                          fallback="/images/image-error.png"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                // 单张图片
                <div className="feedDetailModal_media_imageWrapper" onClick={handleImageClick}>
                  <Image
                    src={imageList[0] || coverUrl}
                    alt="Cover"
                    className="feedDetailModal_media_img"
                    preview={false}
                    fallback="/images/image-error.png"
                    onLoad={handleImageLoad}
                  />
                </div>
              )}
            </div>
          </Image.PreviewGroup>
        </>
      )}
    </div>
  )
}

export default memo(MediaSection)
