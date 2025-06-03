import React, { ForwardedRef, forwardRef, memo } from "react";
import styles from "../../image.module.scss";
import localUpload from "../../../videoPage/images/localUpload.png";
import { Input } from "antd";
import { useShallow } from "zustand/react/shallow";
import { useImagePageStore } from "../../useImagePageStore";
import ImgTextImagesView from "./ImgTextImagesView";
import { ChooseChunk } from "@/app/[lng]/publish/components/CommonComponents/CommonComponents";
import ImgChoose from "@/app/[lng]/publish/components/Choose/ImgChoose";

const { TextArea } = Input;

export interface IImageLeftSettingRef {}

export interface IImageLeftSettingProps {}

const ImageLeftSetting = memo(
  forwardRef(
    ({}: IImageLeftSettingProps, ref: ForwardedRef<IImageLeftSettingRef>) => {
      const { commonPubParams, setCommonPubParams, addImages, images } =
        useImagePageStore(
          useShallow((state) => ({
            setAllPubParams: state.setAllPubParams,
            commonPubParams: state.commonPubParams,
            setCommonPubParams: state.setCommonPubParams,
            addImages: state.addImages,
            images: state.images,
          })),
        );

      return (
        <div className={styles.imageLeftSetting}>
          <div className="imageLeftSetting-upload">
            {images.length === 0 ? (
              <ImgChoose
                onMultipleChoose={(imgFiles) => {
                  if (imgFiles.length !== 0) {
                    addImages(imgFiles);
                  }
                }}
              >
                <ChooseChunk
                  text="本地上传"
                  imgUrl={localUpload.src}
                  color="linear-gradient(to right, rgb(255, 142, 28), rgb(255, 124, 24))"
                  hoverColor="rgb(255, 142, 28)"
                  style={{
                    marginRight: "15px",
                    width: "260px",
                    height: "180px",
                  }}
                />
              </ImgChoose>
            ) : (
              <ImgTextImagesView />
            )}
          </div>

          <div className="imageLeftSetting-commonPar">
            <div className="imageLeftSetting-commonPar-titles">
              <label>通用发布设置</label>
            </div>

            <div className="imageLeftSetting-commonPar-item">
              <label>一键设置标题：</label>
              <Input
                value={commonPubParams.title}
                placeholder="请输入标题"
                showCount
                variant="filled"
                onChange={(e) => {
                  setCommonPubParams({
                    title: e.target.value,
                  });
                }}
              />
            </div>

            <div
              className="imageLeftSetting-commonPar-item"
              style={{ alignItems: "baseline" }}
            >
              <label>一键设置简介：</label>
              <TextArea
                value={commonPubParams.describe}
                maxLength={1000}
                placeholder="请输入简介"
                showCount
                variant="filled"
                onChange={(e) => {
                  setCommonPubParams({
                    describe: e.target.value,
                  });
                }}
              />
            </div>
          </div>
        </div>
      );
    },
  ),
);
ImageLeftSetting.displayName = "ImageLeftSetting";

export default ImageLeftSetting;
