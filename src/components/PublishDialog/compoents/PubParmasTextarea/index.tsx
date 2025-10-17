import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Image, Input, message, Tooltip, Upload } from "antd";
import styles from "@/components/PublishDialog/compoents/PubParmasTextarea/pubCommonComps.module.scss";
import { ReactSortable } from "react-sortablejs";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { CaretRightOutlined, CloseOutlined } from "@ant-design/icons";
import { TextAreaRef } from "antd/es/input/TextArea";
import {
  IImgFile,
  IVideoFile,
} from "@/components/PublishDialog/publishDialog.type";

import VideoCoverSeting from "@/components/PublishDialog/compoents/PubParmasTextarea/VideoCoverSeting";
import PubParmasTextareaUpload from "@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasTextareaUpload";
import { AccountPlatInfoMap, PlatType } from "@/app/config/platConfig";
import { PubType } from "@/app/config/publishConfig";
import { useTransClient } from "@/app/i18n/client";
import PubParmasTextuploadImage from "@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasTextuploadImage";
import VideoPreviewModal from "@/components/VideoPreviewModal";

const { TextArea } = Input;
const { Dragger } = Upload;

export interface IPubParmasTextareaRef {}

export interface IChangeParams {
  imgs?: IImgFile[];
  video?: IVideoFile;
  value: string;
}

export interface IPubParmasTextareaProps {
  onChange?: (values: IChangeParams) => void;
  rows?: number;
  // 视频数量限制
  videoMax?: number;
  // 扩展内容
  extend?: React.ReactNode;
  // 在前面的扩展元素
  beforeExtend?: React.ReactNode;
  // 平台类型
  platType: PlatType;
  style?: CSSProperties;
  imageFileListValue?: IImgFile[];
  videoFileValue?: IVideoFile;
  desValue?: string;
}

const PubParmasTextarea = memo(
  forwardRef(
    (
      {
        style,
        onChange,
        rows = 12,
        videoMax = 1,
        extend,
        imageFileListValue = [],
        videoFileValue,
        desValue = "",
        beforeExtend,
        platType,
      }: IPubParmasTextareaProps,
      ref: ForwardedRef<IPubParmasTextareaRef>,
    ) => {
      const [value, setValue] = useState(desValue);
      const [previewData, setPreviewData] = useState<
        IImgFile | IVideoFile | undefined
      >(undefined);
      // 图片
      const [imageFileList, setImageFileList] =
        useState<IImgFile[]>(imageFileListValue);
      // 视频
      const [videoFile, setVideoFile] = useState<IVideoFile | undefined>(
        videoFileValue,
      );
      // 裁剪弹框
      const [videoCoverSetingModal, setVideoCoverSetingModal] = useState(false);
      const textareaRef = useRef<TextAreaRef>(null);
      const isFirst = useRef({
        effect: true,
        sort: true,
      });
      const { t } = useTransClient("publish");

      useEffect(() => {
        if (isFirst.current.effect) {
          isFirst.current.effect = false;
          return;
        }
        const values = {
          imgs: imageFileList,
          video: videoFile,
          value,
        };
        if (onChange) onChange(values);
      }, [imageFileList, videoFile, value]);
      useEffect(() => {
        setImageFileList(imageFileListValue ?? []);
      }, [imageFileListValue]);
      useEffect(() => {
        setValue(desValue || "");
      }, [desValue]);
      useEffect(() => {
        setVideoFile(videoFileValue);
      }, [videoFileValue]);

      const platConfig = useMemo(() => {
        return AccountPlatInfoMap.get(platType)! || {};
      }, [platType]);
      const imageMax = useMemo(() => {
        return platConfig.commonPubParamsConfig?.imagesMax || 10;
      }, [platConfig]);

      // 动态accept类型
      const uploadAccept = useMemo(() => {
        const hasImage = imageFileList.length !== 0;
        const hasVideo = !!videoFile;
        if (hasImage && !hasVideo && platConfig.pubTypes.has(PubType.ImageText))
          return "image/*";
        if (!hasImage && hasVideo && platConfig.pubTypes.has(PubType.VIDEO))
          return "video/*";

        if (
          platConfig.pubTypes.has(PubType.ImageText) &&
          platConfig.pubTypes.has(PubType.VIDEO)
        )
          return "video/*,image/*";
        if (platConfig.pubTypes.has(PubType.ImageText)) return "image/*";
        if (platConfig.pubTypes.has(PubType.VIDEO)) return "video/*";

        return "video/*,image/*";
      }, [imageFileList, videoFile, platConfig]);

      // 是否可见Dragger
      const canShowDragger = useMemo(() => {
        const imageCount = imageFileList.length;
        const videoCount = videoFile ? 1 : 0;
        const hasImage = imageCount > 0;
        const hasVideo = videoCount > 0;

        if (hasImage && imageCount >= imageMax) return false;
        if (hasVideo && videoCount >= videoMax) return false;
        // 视频和图片都没有，或者只选一种且未到上限
        return true;
      }, [videoFile, imageMax, videoMax, videoFile]);

      // 检查上传文件类型
      const checkFileListType = useCallback(
        (fileList: File[]) => {
          const hasImageInList = imageFileList.length !== 0;
          const hasVideoInList = !!videoFile;
          let uploadHasImage = false;
          let uploadHasVideo = false;
          let invalidFile = false;

          for (const file of fileList) {
            if (file.type.startsWith("image/")) {
              uploadHasImage = true;
            } else if (file.type.startsWith("video/")) {
              uploadHasVideo = true;
            } else {
              invalidFile = true;
            }
          }

          const messageOpen = (content: string) => {
            message.open({
              content: content,
              type: "warning",
              key: "1",
            });
          };

          if (uploadHasImage && !platConfig.pubTypes.has(PubType.ImageText)) {
            messageOpen(t("validation.uploadImage"));
            return false;
          }
          if (uploadHasVideo && !platConfig.pubTypes.has(PubType.VIDEO)) {
            messageOpen(t("validation.uploadVideo"));
            return false;
          }

          // 已有图片，只能传图片
          if (hasImageInList && !hasVideoInList && uploadHasVideo) {
            messageOpen(t("validation.imageOnly"));
            return false;
          }
          // 已有视频，只能传视频
          if (hasVideoInList && !hasImageInList && uploadHasImage) {
            messageOpen(t("validation.videoOnly"));
            return false;
          }
          // 混合上传拦截
          if (
            (uploadHasImage && uploadHasVideo) ||
            (hasImageInList && uploadHasVideo) ||
            (hasVideoInList && uploadHasImage)
          ) {
            messageOpen(t("validation.imageVideoMixed"));
            return false;
          }
          // 非法类型
          if (invalidFile) {
            messageOpen(t("validation.onlyImageOrVideo"));
            return false;
          }
          if (uploadHasVideo) {
            // 视频条数限制
            const totalVideoCount =
              (videoFile ? 1 : 0) +
              fileList.filter((f) => f.type.startsWith("video/")).length;
            if (totalVideoCount > videoMax) {
              messageOpen(
                t("validation.videoMaxExceeded", { maxCount: videoMax }),
              );
              return false;
            }
          }
          if (uploadHasImage) {
            // 图片条数限制
            const totalImageCount =
              imageFileList.length +
              fileList.filter((f) => f.type.startsWith("image/")).length;
            if (totalImageCount > imageMax) {
              messageOpen(
                t("validation.imageMaxExceeded", { maxCount: imageMax }),
              );
              return false;
            }
          }
          return true;
        },
        [imageFileList, videoMax, imageMax, videoFile, platConfig],
      );

      const desMax = useMemo(() => {
        return platConfig.commonPubParamsConfig?.desMax || 2200;
      }, [platConfig]);

      return (
        <>
          <VideoCoverSeting
            videoCoverSetingModal={videoCoverSetingModal}
            onClose={() => setVideoCoverSetingModal(false)}
            videoFile={videoFile}
            value={videoFile?.cover}
            onChoosed={(newCover) => {
              setVideoFile((prevState) => {
                const newState = { ...(prevState as IVideoFile) };
                newState.cover = newCover;
                return newState;
              });
            }}
          />

          <Image
            src={(previewData as IImgFile)?.imgUrl}
            style={{
              width: "100%",
              height: "400px",
              objectFit: "contain",
              display: "none",
            }}
            preview={{
              visible: !!(previewData && (previewData as IImgFile).imgUrl),
              onVisibleChange: (visible) => {
                if (!visible) setPreviewData(undefined);
              },
            }}
          />
          <VideoPreviewModal
            open={!!(previewData && (previewData as IVideoFile).videoUrl)}
            videoUrl={(previewData as IVideoFile)?.videoUrl}
            onCancel={() => setPreviewData(undefined)}
          />

          <div className={styles.pubParmasTextarea} style={style}>
            <div className="pubParmasTextarea-input">
              {beforeExtend}
              <TextArea
                ref={textareaRef}
                placeholder={t("form.descriptionPlaceholder")}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={rows}
                autoFocus={true}
                maxLength={desMax}
                onFocus={() => {
                  setTimeout(() => {
                    if (textareaRef.current) {
                      const val =
                        textareaRef.current.resizableTextArea!.textArea;
                      const len = value.length;
                      val.setSelectionRange(len, len);
                    }
                  }, 10);
                }}
              />
              <ReactSortable
                className="pubParmasTextarea-uploads"
                list={imageFileList}
                animation={250}
                setList={(newList) => {
                  if (isFirst.current.sort) {
                    isFirst.current.sort = false;
                    return;
                  }
                  setImageFileList(newList);
                }}
                scrollSensitivity={100}
                scrollSpeed={15}
                id="id"
              >
                <TransitionGroup
                  className="pubParmasTextarea-uploads-list"
                  component={null}
                >
                  {/* 图像 ------------------------------------------- */}
                  {imageFileList.map((v, i) => (
                    <CSSTransition
                      key={v.id || v.imgUrl}
                      timeout={300}
                      classNames={{
                        enter: styles.itemEnter,
                        enterActive: styles.itemEnterActive,
                        exit: styles.itemExit,
                        exitActive: styles.itemExitActive,
                      }}
                    >
                      <PubParmasTextuploadImage
                        onEditOk={(editedImg) => {
                          setImageFileList((prevState) => {
                            const newState = [...prevState];
                            newState[i] = editedImg;
                            return newState;
                          });
                        }}
                        imageFile={v}
                        onClick={() => {
                          setPreviewData(v);
                        }}
                        onClose={() => {
                          setImageFileList((prevState) => {
                            const newState = [...prevState];
                            newState.splice(i, 1);
                            return newState;
                          });
                        }}
                      />
                    </CSSTransition>
                  ))}

                  {/* 视频 ------------------------------------------- */}
                  {(videoFile ? [videoFile] : []).map((v, i) => {
                    return (
                      <CSSTransition
                        timeout={300}
                        classNames={{
                          enter: styles.itemEnter,
                          enterActive: styles.itemEnterActive,
                          exit: styles.itemExit,
                          exitActive: styles.itemExitActive,
                        }}
                        key={i}
                      >
                        <div
                          className="pubParmasTextarea-uploads-item"
                          onClick={() => {
                            setPreviewData(videoFile);
                          }}
                        >
                          <div
                            className="pubParmasTextarea-uploads-item-close"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoFile(undefined);
                            }}
                          >
                            <CloseOutlined />
                          </div>
                          <Tooltip title={t("actions.preview")}>
                            <div className="pubParmasTextarea-uploads-item-video">
                              <img src={v.cover.imgUrl} />
                              <div className="pubParmasTextarea-uploads-item-play">
                                <CaretRightOutlined />
                              </div>
                            </div>
                          </Tooltip>
                        </div>
                      </CSSTransition>
                    );
                  })}

                  {canShowDragger && (
                    <CSSTransition
                      key="dragger"
                      timeout={300}
                      classNames={{
                        enter: styles.itemEnter,
                        enterActive: styles.itemEnterActive,
                        exit: styles.itemExit,
                        exitActive: styles.itemExitActive,
                      }}
                      unmountOnExit
                    >
                      <PubParmasTextareaUpload
                        checkFileListType={checkFileListType}
                        uploadAccept={uploadAccept}
                        onVideoUpdateFinish={(video) => {
                          setVideoFile(video);
                        }}
                        onImgUpdateFinish={(imgs) => {
                          setImageFileList((prevState) => {
                            return [...prevState, ...imgs];
                          });
                        }}
                      />
                    </CSSTransition>
                  )}
                </TransitionGroup>
              </ReactSortable>

              {videoFile && videoFile.file && (
                <Button
                  style={{ marginTop: "10px" }}
                  onClick={() => setVideoCoverSetingModal(true)}
                >
                  {t("actions.cropCover")}
                </Button>
              )}

              <div className="pubParmasTextarea-maxLength">
                {desMax - value.length}
              </div>
            </div>

            {extend && <div className="pubParmasTextarea-other">{extend}</div>}
          </div>
        </>
      );
    },
  ),
);

export default PubParmasTextarea;
