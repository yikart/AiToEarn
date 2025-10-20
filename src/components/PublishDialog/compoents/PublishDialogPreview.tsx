import { ForwardedRef, forwardRef, memo, useEffect, useRef } from "react";
import styles from "../publishDialog.module.scss";
import { Empty } from "antd";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useTranslation } from "react-i18next";
import "swiper/css";
import "swiper/css/pagination";

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时长
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

export interface IPublishDialogPreviewRef {}

export interface IPublishDialogPreviewProps {}

// 预览
const PublishDialogPreview = memo(
  forwardRef(
    (
      {}: IPublishDialogPreviewProps,
      ref: ForwardedRef<IPublishDialogPreviewRef>,
    ) => {
      const { t } = useTranslation("publish");
      const { expandedPubItem } = usePublishDialog(
        useShallow((state) => ({
          expandedPubItem: state.expandedPubItem,
          pubList: state.pubList,
        })),
      );
      const videoRef = useRef<HTMLVideoElement>(null);

      useEffect(() => {
        if (!expandedPubItem) {
          videoRef.current?.pause();
        }
      }, [expandedPubItem]);

      return (
        <div className={styles.publishDialogPreview}>
          <div className="publishDialogPreview-wrapper">
            <div className="publishDialogPreview-title">
              {t("preview.title")}
            </div>
            {expandedPubItem &&
            (expandedPubItem?.params.video ||
              (expandedPubItem?.params.images &&
                expandedPubItem?.params.images?.length !== 0)) ? (
              <div className="publishDialogPreview-preview">
                {expandedPubItem?.params.video ? (
                  <div className="publishDialogPreview-preview-video">
                    <div className="publishDialogPreview-preview-video-wrapper">
                      <div className="publishDialogPreview-preview-video-top" />
                      <video
                        ref={videoRef}
                        src={expandedPubItem.params.video?.videoUrl}
                        controls
                        poster={expandedPubItem.params.video?.cover?.imgUrl}
                      />
                      {/* 视频信息显示 */}
                      <div className="publishDialogPreview-video-info" style={{ color: '#fff', fontSize: '11px' }}>
                        <div className="publishDialogPreview-video-info-item">
                          <span className="publishDialogPreview-video-info-label">{t('preview.videoInfo.filename' as any)}:</span>
                          <span className="publishDialogPreview-video-info-value">
                            {expandedPubItem.params.video?.filename || 'Unknown'}
                          </span>
                        </div>
                        <div className="publishDialogPreview-video-info-item">
                          <span className="publishDialogPreview-video-info-label">{t('preview.videoInfo.format' as any)}:</span>
                          <span className="publishDialogPreview-video-info-value">
                            {expandedPubItem.params.video?.filename?.split('.').pop()?.toUpperCase() || 'Unknown'}
                          </span>
                        </div>
                        <div className="publishDialogPreview-video-info-item">
                          <span className="publishDialogPreview-video-info-label">{t('preview.videoInfo.resolution' as any)}:</span>
                          <span className="publishDialogPreview-video-info-value">
                            {expandedPubItem.params.video?.width && expandedPubItem.params.video?.height 
                              ? `${expandedPubItem.params.video.width}x${expandedPubItem.params.video.height}`
                              : 'Unknown'
                            }
                          </span>
                        </div>
                        <div className="publishDialogPreview-video-info-item">
                          <span className="publishDialogPreview-video-info-label">{t('preview.videoInfo.size' as any)}:</span>
                          <span className="publishDialogPreview-video-info-value">
                            {expandedPubItem.params.video?.size 
                              ? formatFileSize(expandedPubItem.params.video.size)
                              : 'Unknown'
                            }
                          </span>
                        </div>
                        <div className="publishDialogPreview-video-info-item">
                          <span className="publishDialogPreview-video-info-label">{t('preview.videoInfo.duration' as any)}:</span>
                          <span className="publishDialogPreview-video-info-value">
                            {expandedPubItem.params.video?.duration 
                              ? formatDuration(expandedPubItem.params.video.duration)
                              : 'Unknown'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="publishDialogPreview-preview-video">
                    <div className="publishDialogPreview-preview-video-wrapper">
                      <div className="publishDialogPreview-preview-video-top" />
                      <div className="publishDialogPreview-preview-images">
                        <Swiper
                          loop={
                            (expandedPubItem!.params.images?.length || 0) > 1
                          }
                          modules={[Navigation, Pagination]}
                          pagination={{
                            clickable: true,
                            el: ".swiper-pagination",
                          }}
                        >
                          {expandedPubItem!.params.images!.map(
                            (image, index) => (
                              <SwiperSlide key={index + image.imgUrl}>
                                <img
                                  src={image.imgUrl}
                                  alt={`Image ${index + 1}`}
                                />
                              </SwiperSlide>
                            ),
                          )}
                        </Swiper>
                        <div className="swiper-pagination"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="publishDialogPreview-empty">
                <Empty description={t("preview.emptyDescription")} />
              </div>
            )}
          </div>
        </div>
      );
    },
  ),
);

export default PublishDialogPreview;
