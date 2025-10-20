import React, {
  ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dropdown, message, Progress, Upload } from "antd";
import {
  formatImg,
  formatVideo,
} from "@/components/PublishDialog/PublishDialog.util";
import {
  IImgFile,
  IVideoFile,
} from "@/components/PublishDialog/publishDialog.type";
import { toolsApi } from "@/api/tools";
import { OSS_URL } from "@/constant";
import { RcFile } from "antd/es/upload";
import { useTransClient } from "@/app/i18n/client";
import { UploadRef } from "antd/es/upload/Upload";
import { PlusOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import MaterialSelectionModal from "@/components/PublishDialog/compoents/MaterialSelectionModal";
import { getOssUrl } from "@/utils/oss";

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
      const uploadRef = useRef<UploadRef>(null);
      const [materialSelectionOpen, setMaterialSelectionOpen] = useState(false);

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

      const dropdownItems: MenuProps["items"] = useMemo(() => {
        return [
          {
            key: "1",
            label: (
              <a
                onClick={() => {
                  // 触发上传
                  uploadRef
                    .current!.nativeElement?.querySelector("input")!
                    .click();
                }}
              >
                {t("upload.uploadLocal")}
              </a>
            ),
          },
          {
            key: "2",
            label: (
              <a onClick={() => setMaterialSelectionOpen(true)}>
                {t("actions.selectMaterial")}
              </a>
            ),
          },
        ];
      }, [t]);

      return (
        <div
          className="pubParmasTextarea-uploads-upload"
          onClick={(e) => e.stopPropagation()}
        >
          <MaterialSelectionModal
            onCancel={() => setMaterialSelectionOpen(false)}
            libraryModalOpen={materialSelectionOpen}
            allowImage={uploadAccept.includes("image")}
            allowVideo={uploadAccept.includes("video")}
            onSelected={async (item) => {
              setUploadLoading(true);
              const ossUrl = getOssUrl(item.url);
              try {
                if (item.type === "img") {
                  // 图片素材，下载
                  const req = await fetch(
                    ossUrl.replace(OSS_URL, "/ossProxy/"),
                  );
                  const blob = await req.blob();
                  const imagefile = await formatImg({
                    blob,
                    path: `${item.title || "image"}.${blob.type.split("/")[1]}`,
                  });
                  imagefile["ossUrl"] = item.url;
                  onImgUpdateFinish([imagefile]);
                } else {
                  const coverOss = getOssUrl(item.thumbUrl || "");
                  const video: any = {
                    ossUrl: ossUrl,
                    videoUrl: ossUrl,
                    cover: {
                      ossUrl: coverOss,
                      imgUrl: coverOss,
                    },
                  };
                  console.log(video);
                  onVideoUpdateFinish(video);
                }
              } catch (e) {
                console.error(e);
              } finally {
                setUploadLoading(false);
              }
            }}
          />

          <Dragger
            ref={uploadRef}
            style={{ display: "none" }}
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
          />

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
            <Dropdown menu={{ items: dropdownItems }} placement="top">
              <div className="pubParmasTextarea-uploads-upload-blocker">
                <PlusOutlined style={{ fontSize: "20px" }} />
                {t("upload.selectFile")}
              </div>
            </Dropdown>
          )}
        </div>
      );
    },
  ),
);

export default PubParmasTextareaUpload;
