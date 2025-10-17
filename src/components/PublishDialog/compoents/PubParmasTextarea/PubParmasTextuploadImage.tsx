import React, { ForwardedRef, forwardRef, memo, useState } from "react";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { IImgFile } from "@/components/PublishDialog/publishDialog.type";
import dynamic from "next/dynamic";

const ImageEditorModal = dynamic(
  () => import("@/components/ImageEditorModal"),
  { ssr: false },
);

export interface IPubParmasTextuploadImageRef {}

export interface IPubParmasTextuploadImageProps {
  onClose: () => void;
  onClick: () => void;
  imageFile: IImgFile;
  onEditOk: (editedImg: IImgFile) => void;
}

const PubParmasTextuploadImage = memo(
  forwardRef(
    (
      { onClick, onClose, imageFile, onEditOk }: IPubParmasTextuploadImageProps,
      ref: ForwardedRef<IPubParmasTextuploadImageRef>,
    ) => {
      const { t } = useTranslation("publish");
      const [imageEditorOpen, setImageEditorOpen] = useState(false);

      return (
        <>
          <ImageEditorModal
            onOk={(editedImg) => {
              onClose();
              onEditOk(editedImg);
            }}
            imgFile={imageFile}
            open={imageEditorOpen}
            onCancel={() => setImageEditorOpen(false)}
          />

          <div className="pubParmasTextarea-uploads-item" onClick={onClick}>
            <div
              className="pubParmasTextarea-uploads-item-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <CloseOutlined />
            </div>
            <Tooltip title={t("actions.preview")}>
              <img src={imageFile.imgUrl} alt="preview" />
            </Tooltip>

            <Tooltip title="Edit">
              <Button
                className="pubParmasTextarea-uploads-item-edit"
                icon={<EditOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageEditorOpen(true);
                }}
              />
            </Tooltip>
          </div>
        </>
      );
    },
  ),
);

export default PubParmasTextuploadImage;
