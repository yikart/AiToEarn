import type { ForwardedRef } from 'react'
import type { IImgFile } from '@/components/PublishDialog/publishDialog.type'
import { CloseOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import React, { forwardRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import PublishUploadProgress from '@/components/PublishDialog/compoents/PublishManageUpload/PublishUploadProgress'

export interface IPubParmasTextuploadImageRef {}

export interface IPubParmasTextuploadImageProps {
  onClose: () => void
  onClick: () => void
  imageFile: IImgFile
  onEditClick: () => void
  onImageToImageClick?: () => void
}

const PubParmasTextuploadImage = memo(
  forwardRef(
    (
      {
        onClick,
        onClose,
        imageFile,
        onEditClick,
        onImageToImageClick,
      }: IPubParmasTextuploadImageProps,
      ref: ForwardedRef<IPubParmasTextuploadImageRef>,
    ) => {
      const { t } = useTranslation('publish')

      return (
        <>
          <div className="pubParmasTextarea-uploads-item" onClick={onClick}>
            <div
              className="pubParmasTextarea-uploads-item-close"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              <CloseOutlined />
            </div>
            <Tooltip title={t('actions.preview')}>
              <img src={imageFile.imgUrl} alt="preview" />
            </Tooltip>

            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              display: 'flex',
              gap: 4,
              zIndex: 1,
            }}
            >
              <Tooltip title="Edit">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditClick()
                  }}
                  style={{
                    minWidth: 'auto',
                    padding: '4px 8px',
                  }}
                />
              </Tooltip>

              {onImageToImageClick && (
                <Tooltip title={t('aiFeatures.imageToImage' as any)}>
                  <Button
                    icon={<PictureOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onImageToImageClick()
                    }}
                    style={{
                      minWidth: 'auto',
                      padding: '4px 8px',
                    }}
                  />
                </Tooltip>
              )}
            </div>

            {imageFile.uploadTaskId && (
              <PublishUploadProgress taskId={imageFile.uploadTaskId} />
            )}
          </div>
        </>
      )
    },
  ),
)

export default PubParmasTextuploadImage
