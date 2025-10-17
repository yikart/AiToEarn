import React, { ForwardedRef, forwardRef, memo } from "react";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { IImgFile } from "@/components/PublishDialog/publishDialog.type";

export interface IPubParmasTextuploadImageRef {}

export interface IPubParmasTextuploadImageProps {
  onClose: () => void;
  onClick: () => void;
  imageFile: IImgFile;
  onEditClick: () => void;
}

const PubParmasTextuploadImage = memo(
  forwardRef(
    (
      {
        onClick,
        onClose,
        imageFile,
        onEditClick,
      }: IPubParmasTextuploadImageProps,
      ref: ForwardedRef<IPubParmasTextuploadImageRef>,
    ) => {
      const { t } = useTranslation("publish");

      return (
        <>
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
                  onEditClick();
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
