import { ForwardedRef, forwardRef, memo, useEffect, useRef } from "react";
import styles from "../publishDialog.module.scss";
import { Empty } from "antd";
import { usePublishDialog } from "@/components/PublishDialog/usePublishDialog";
import { useShallow } from "zustand/react/shallow";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export interface IPublishDialogPreviewRef {}

export interface IPublishDialogPreviewProps {}

// 预览
const PublishDialogPreview = memo(
  forwardRef(
    (
      {}: IPublishDialogPreviewProps,
      ref: ForwardedRef<IPublishDialogPreviewRef>,
    ) => {
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
            <div className="publishDialogPreview-title">预览</div>
            {expandedPubItem &&
            (expandedPubItem?.params.video ||
              expandedPubItem?.params.images?.length !== 0) ? (
              <div className="publishDialogPreview-preview">
                {expandedPubItem?.params.video ? (
                  <div className="publishDialogPreview-preview-video">
                    <div className="publishDialogPreview-preview-video-wrapper">
                      <div className="publishDialogPreview-preview-video-top" />
                      <video
                        ref={videoRef}
                        src={expandedPubItem.params.video?.videoUrl}
                        controls
                        poster={expandedPubItem.params.video?.cover.imgUrl}
                      />
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
                <Empty description="在这里看到你的作品预览" />
              </div>
            )}
          </div>
        </div>
      );
    },
  ),
);

export default PublishDialogPreview;
