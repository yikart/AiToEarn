import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useRef,
  useState,
} from "react";
import { message, Progress, Tooltip, Upload } from "antd";
import {
  formatImg,
  formatVideo,
} from "@/components/PublishDialog/PublishDialog.util";
import { PlusOutlined } from "@ant-design/icons";
import {
  IImgFile,
  IVideoFile,
} from "@/components/PublishDialog/publishDialog.type";
import { toolsApi } from "@/api/tools";
import { OSS_URL } from "@/constant";
import { RcFile } from "antd/es/upload";
import { useTransClient } from "@/app/i18n/client";

const { Dragger } = Upload;

export interface IPubParmasTextareaUploadRef {}

export interface IPubParmasTextareaUploadProps {
  uploadAccept: string;
  checkFileListType: (fileList: File[]) => boolean;
  onVideoUpdateFinish: (video: IVideoFile) => void;
  onImgUpdateFinish: (img: IImgFile[]) => void;
}

const PubParmasTextareaUpload = memo(
  forwardRef(
    (
      {
        uploadAccept,
        checkFileListType,
        onVideoUpdateFinish,
        onImgUpdateFinish,
      }: IPubParmasTextareaUploadProps,
      ref: ForwardedRef<IPubParmasTextareaUploadRef>,
    ) => {
      // 上传数量
      const [uploadCount, setUploadCount] = useState(0);
      // 上传进度
      const [uploadProgress, setUploadProgress] = useState(0);
      // 上传loading
      const [uploadLoading, setUploadLoading] = useState(false);
      const chooseCount = useRef<number>(0);
      const fileListRef = useRef<RcFile[]>([]);
      const { t } = useTransClient("publish");

      // 上传视频
      const uploadVideo = useCallback(
        async (video: IVideoFile) => {
          setUploadCount(1);
          setUploadProgress(0);
          setUploadLoading(true);
          try {
            // 上传视频
            const uploadVideoRes = await toolsApi.uploadFileTemp(
              video.file,
              (prog) => {
                setUploadProgress(prog === 100 ? 99 : prog);
              },
            );
            setUploadProgress(100);
            // 上传封面
            const uploadCoverRes = await toolsApi.uploadFileTemp(
              video.cover.file,
            );

            setUploadLoading(false);
            video["ossUrl"] = `${OSS_URL}${uploadVideoRes}`;
            video.cover["ossUrl"] = `${OSS_URL}${uploadCoverRes}`;

            onVideoUpdateFinish(video);
          } catch (e) {
            console.error(e);
            setUploadLoading(false);
            message.error("上传失败，请稍后重试");
          }
        },
        [onVideoUpdateFinish],
      );

      // 上传图片
      const uploadImg = useCallback(
        async (fileList: RcFile[]) => {
          setUploadCount(fileList.length);
          setUploadProgress(0);
          setUploadLoading(true);

          let uploadFinishCount = 0;
          const tasks: Promise<IImgFile>[] = [];

          const uploadImgCore = async (image: IImgFile): Promise<IImgFile> => {
            const uploadRes = await toolsApi.uploadFileTemp(image.file);
            uploadFinishCount++;
            image["ossUrl"] = `${OSS_URL}${uploadRes}`;
            setUploadProgress(
              Math.floor((uploadFinishCount / fileList.length) * 100),
            );
            return image;
          };

          for (const file of fileList) {
            const image = await formatImg({
              blob: file!,
              path: file.name,
            });
            tasks.push(uploadImgCore(image));
          }
          const imagesRes = await Promise.all(tasks);
          setUploadLoading(false);
          onImgUpdateFinish(imagesRes);
        },
        [onImgUpdateFinish],
      );

      return (
        <div
          className="pubParmasTextarea-uploads-upload"
          onClick={(e) => e.stopPropagation()}
        >
          {uploadLoading ? (
            <div className="pubParmasTextarea-uploads-upload-loading">
              <Progress
                type="circle"
                percent={uploadProgress}
                size={80}
                strokeWidth={4}
                strokeColor="var(--theColor5)"
                format={
                  uploadProgress >= 100
                    ? () => (
                        <span
                          style={{
                            fontSize: "var(--fs-xs)",
                            display: "inline-block",
                            padding: "10px",
                            color: "var(--theColor6)",
                          }}
                        >
                          {t("upload.finishingUp")}
                        </span>
                      )
                    : undefined
                }
              />
              {uploadCount > 1 && (
                <div className="pubParmasTextarea-uploads-upload-count">
                  {uploadCount}
                </div>
              )}
            </div>
          ) : (
            <Tooltip title={t("upload.uploadImageOrVideo")}>
              <Dragger
                accept={uploadAccept}
                multiple={uploadAccept.includes("image")}
                listType="text"
                beforeUpload={async (file, uploadFileList) => {
                  if (!checkFileListType(uploadFileList)) {
                    return Upload.LIST_IGNORE;
                  }
                  if (file.type.startsWith("video/")) {
                    const video = await formatVideo(file);
                    await uploadVideo(video);
                  } else {
                    chooseCount.current++;
                    fileListRef.current = [...fileListRef.current, file];

                    if (chooseCount.current === uploadFileList.length) {
                      await uploadImg(fileListRef.current);
                      fileListRef.current = [];
                      chooseCount.current = 0;
                    }
                  }
                  return false;
                }}
                showUploadList={false}
              >
                <PlusOutlined />
                <p>{t("upload.dragAndSelect")}</p>
              </Dragger>
            </Tooltip>
          )}
        </div>
      );
    },
  ),
);

export default PubParmasTextareaUpload;
