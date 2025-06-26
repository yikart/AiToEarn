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
import {
  CaretRightOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { IVideoFile } from "@/app/[lng]/publish/components/Choose/VideoChoose";
import { IImgFile } from "@/app/[lng]/publish/components/Choose/ImgChoose";
import { formatVideo } from "@/app/[lng]/publish/components/Choose/videoChoose.util";
import { formatImg } from "@/app/[lng]/publish/components/Choose/ImgChoose.util";
import VideoCoverSeting from "@/app/[lng]/publish/videoPage/components/VideoCoverSeting";
import isEqual from "lodash/isEqual";
import { TextAreaRef } from "antd/es/input/TextArea";

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
  // 图片数量限制
  imageMax?: number;
  // 扩展内容
  extend?: React.ReactNode;
  // 在前面的扩展元素
  beforeExtend?: React.ReactNode;
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
        imageMax = 20,
        extend,
        imageFileListValue = [],
        videoFileValue,
        desValue = "",
        beforeExtend
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

      useEffect(() => {
        const values = {
          imgs: imageFileList,
          video: videoFile,
          value,
        };
        if (onChange) onChange(values);
      }, [imageFileList, videoFile, value]);

      useEffect(() => {
        if (imageFileListValue.length === 0 && imageFileList.length === 0)
          return;
        if (isEqual(imageFileListValue, imageFileList)) {
          setImageFileList(imageFileListValue);
        }
      }, [imageFileListValue]);
      useEffect(() => {
        setValue(desValue || "");
      }, [desValue]);
      useEffect(() => {
        setVideoFile(videoFileValue);
      }, [videoFileValue]);

      // 动态accept类型
      const uploadAccept = useMemo(() => {
        const hasImage = imageFileList.length !== 0;
        const hasVideo = !!videoFile;
        if (hasImage && !hasVideo) return "image/*";
        if (!hasImage && hasVideo) return "video/*";
        return "image/*,video/*";
      }, [imageFileList, videoFile]);

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
        [imageFileList, videoMax, imageMax, videoFile],
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
                  <Image
                    src={(previewData as IImgFile).imgUrl}
                    style={{ width: "100%" }}
                  />
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
              <ReactSortable
                className="pubParmasTextarea-uploads"
                list={imageFileList}
                animation={250}
                setList={setImageFileList}
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
                      key={v.id}
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
                      <Tooltip title="上传图片或视频">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Dragger
                            accept={uploadAccept}
                            multiple={true}
                            listType="text"
                            beforeUpload={async (file, fileList) => {
                              if (!checkFileListType(fileList)) {
                                return Upload.LIST_IGNORE;
                              }
                              if (file.type.startsWith("video/")) {
                                // 视频
                                const video = await formatVideo(file);
                                // 封面
                                setVideoFile(video);
                              } else {
                                // 图片
                                const image = await formatImg({
                                  blob: file!,
                                  path: file.name,
                                });
                                setImageFileList((prevState) => {
                                  const newState = [...prevState];
                                  newState.push(image);
                                  return newState;
                                });
                              }
                              return false;
                            }}
                            showUploadList={false}
                          >
                            <PlusOutlined />
                            <p>拖放 & 选择图片或视频</p>
                          </Dragger>
                        </div>
                      </Tooltip>
                    </CSSTransition>
                  )}
                </TransitionGroup>
              </ReactSortable>

              {videoFile && (
                <Button
                  style={{ marginTop: "10px" }}
                  onClick={() => setVideoCoverSetingModal(true)}
                >
                  裁剪封面
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
