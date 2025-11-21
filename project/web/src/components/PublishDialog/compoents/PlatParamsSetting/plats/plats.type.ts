import type { IImgFile, PubItem } from '@/components/PublishDialog/publishDialog.type'

export interface IPlatsParamsRef {}

export interface IPlatsParamsProps {
  pubItem: PubItem
  onImageToImage?: (imageFile: IImgFile) => void
}
