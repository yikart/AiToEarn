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
import { Button, Image, Input, message, Modal, Tooltip, Upload } from "antd";
import styles from "@/components/PublishDialog/compoents/PubParmasTextarea/pubCommonComps.module.scss";
import { ReactSortable } from "react-sortablejs";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { CaretRightOutlined, CloseOutlined } from "@ant-design/icons";
import isEqual from "lodash/isEqual";
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
import { toolsApi } from "@/api/tools";

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
      // 内容安全检测状态
      const [moderationLoading, setModerationLoading] = useState(false);
      const [moderationResult, setModerationResult] = useState<boolean | null>(null);
      const textareaRef = useRef<TextAreaRef>(null);
      const isFirst = useRef({
        effect: true,
        sort: true,
      });
      const { t } = useTransClient("publish");

      // 内容安全检测函数
      const handleContentModeration = useCallback(async () => {
        if (!value.trim()) {
          message.warning("请先输入内容");
          return;
        }
        
        try {
          setModerationLoading(true);
          setModerationResult(null);
          const result = await toolsApi.textModeration(value);
          setModerationResult(result);
          if (result) {
            message.success(t("actions.contentSafe"));
          } else {
            message.warning(t("actions.contentUnsafe"));
          }
        } catch (error) {
          console.error("内容安全检测失败:", error);
          message.error("内容安全检测失败，请稍后重试");
        } finally {
          setModerationLoading(false);
        }
      }, [value, t]);

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
            messageOpen("该平台不支持上传图片");
            return false;
          }
          if (uploadHasVideo && !platConfig.pubTypes.has(PubType.VIDEO)) {
            messageOpen("该平台不支持上传视频");
            return false;
          }

          // 已有图片，只能传图片
          if (hasImageInList && !hasVideoInList && uploadHasVideo) {
            messageOpen("已有图片，仅可继续上传图片，不能上传视频！");
            return false;
          }
          // 已有视频，只能传视频
          if (hasVideoInList && !hasImageInList && uploadHasImage) {
            messageOpen("已有视频，仅可继续上传视频，不能上传图片！");
            return false;
          }
          // 混合上传拦截
          if (
            (uploadHasImage && uploadHasVideo) ||
            (hasImageInList && uploadHasVideo) ||
            (hasVideoInList && uploadHasImage)
          ) {
            messageOpen("图片和视频不能混合上传！");
            return false;
          }
          // 非法类型
          if (invalidFile) {
            messageOpen("只能上传图片或视频文件！");
            return false;
          }
          if (uploadHasVideo) {
            // 视频条数限制
            const totalVideoCount =
              (videoFile ? 1 : 0) +
              fileList.filter((f) => f.type.startsWith("video/")).length;
            if (totalVideoCount > videoMax) {
              messageOpen(`视频上传数量不能大于${videoMax}`);
              return false;
            }
          }
          if (uploadHasImage) {
            // 图片条数限制
            const totalImageCount =
              imageFileList.length +
              fileList.filter((f) => f.type.startsWith("image/")).length;
            if (totalImageCount > imageMax) {
              messageOpen(`图片上传数量不能大于${imageMax}`);
              return false;
            }
          }
          return true;
        },
        [imageFileList, videoMax, imageMax, videoFile, platConfig],
      );

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

          <Modal
            title="查看素材"
            open={!!previewData}
            onCancel={() => setPreviewData(undefined)}
          >
            {previewData && (
              <>
                {previewData!.file.type.startsWith("video") ? (
                  <video
                    src={(previewData as IVideoFile).videoUrl}
                    controls={true}
                    style={{ width: "100%", maxHeight: "600px" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <Image
                      src={(previewData as IImgFile).imgUrl}
                      style={{ width: "100%", height: "400px" }}
                    />
                  </div>
                )}
              </>
            )}
          </Modal>

          <div className={styles.pubParmasTextarea} style={style}>
            <div className="pubParmasTextarea-input">
              {beforeExtend}
              <TextArea
                ref={textareaRef}
                placeholder="开始写"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={rows}
                autoFocus={true}
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
              {value.trim() && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button
                    size="small"
                    loading={moderationLoading}
                    onClick={handleContentModeration}
                    type={moderationResult === true ? "primary" : moderationResult === false ? "default" : "default"}
                    style={{
                      backgroundColor: moderationResult === true ? '#52c41a' : moderationResult === false ? '#ff4d4f' : undefined,
                      borderColor: moderationResult === true ? '#52c41a' : moderationResult === false ? '#ff4d4f' : undefined,
                      color: moderationResult === true || moderationResult === false ? '#fff' : undefined
                    }}
                  >
                    {moderationLoading ? t("actions.checkingContent") : t("actions.contentModeration")}
                  </Button>
                  {moderationResult !== null && (
                    <span style={{ 
                      fontSize: 12, 
                      color: moderationResult ? '#52c41a' : '#ff4d4f',
                      fontWeight: 500
                    }}>
                      {moderationResult ? t("actions.contentSafe") : t("actions.contentUnsafe")}
                    </span>
                  )}
                </div>
              )}
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
                      <div
                        className="pubParmasTextarea-uploads-item"
                        onClick={() => {
                          setPreviewData(v);
                        }}
                      >
                        <div
                          className="pubParmasTextarea-uploads-item-close"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFileList((prevState) => {
                              const newState = [...prevState];
                              newState.splice(i, 1);
                              return newState;
                            });
                          }}
                        >
                          <CloseOutlined />
                        </div>
                        <Tooltip title="点击查看">
                          <img src={v.imgUrl} />
                        </Tooltip>
                      </div>
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
                          <Tooltip title="点击查看">
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
            </div>

            {extend && <div className="pubParmasTextarea-other">{extend}</div>}
          </div>
        </>
      );
    },
  ),
);

export default PubParmasTextarea;
