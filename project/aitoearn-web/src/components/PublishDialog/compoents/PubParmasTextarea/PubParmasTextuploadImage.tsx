/**
 * PubParmasTextuploadImage - 上传图片预览组件
 */
import type { ForwardedRef } from 'react'
import type { IImgFile } from '@/components/PublishDialog/publishDialog.type'
import { Image, Pencil, X } from 'lucide-react'
import React, { forwardRef, memo } from 'react'
import { useTranslation } from 'react-i18next'
import PublishUploadProgress from '@/components/PublishDialog/compoents/PublishManageUpload/PublishUploadProgress'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
        <div
          className="h-[110px] border border-border rounded cursor-pointer relative overflow-hidden"
          onClick={onClick}
        >
          {/* 关闭按钮 */}
          <div
            className="absolute right-1 top-1 z-20 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-black/90 hover:scale-110"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            <X className="h-3 w-3" />
          </div>

          {/* 图片预览 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <img src={imageFile.imgUrl} alt="preview" className="w-full h-full object-cover" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('actions.preview')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 操作按钮 */}
          <div className="absolute bottom-2 right-2 flex gap-1 z-[1]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-w-0 p-1 h-6 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditClick()
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onImageToImageClick && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="min-w-0 p-1 h-6 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        onImageToImageClick()
                      }}
                    >
                      <Image className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('aiFeatures.imageToImage')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* 上传进度 */}
          {imageFile.uploadTaskId && <PublishUploadProgress taskId={imageFile.uploadTaskId} />}
        </div>
      )
    },
  ),
)

export default PubParmasTextuploadImage
