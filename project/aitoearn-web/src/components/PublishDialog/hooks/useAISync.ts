/**
 * AI 同步到编辑器 Hook
 * 处理 AI 生成内容同步到编辑器的逻辑
 */

import type { RefObject } from 'react'
import type {
  AIAction,
  IPublishDialogAiRef,
} from '@/components/PublishDialog/compoents/PublishDialogAi'
import type {
  IImgFile,
  IPubParams,
  IVideoFile,
  PubItem,
} from '@/components/PublishDialog/publishDialog.type'

import { useCallback } from 'react'
import { UploadTaskTypeEnum } from '@/components/PublishDialog/compoents/PublishManageUpload/publishManageUpload.enum'

interface EnqueueUploadHandle {
  taskId: string
  promise: Promise<any>
  cancel: () => void
}

interface UseAISyncParams {
  pubListChoosed: PubItem[]
  step: number
  commonPubParams: IPubParams
  expandedPubItem?: PubItem
  openLeft: boolean
  aiAssistantRef: RefObject<IPublishDialogAiRef | null>
  setOpenLeft: (open: boolean) => void
  setOnePubParams: (params: Partial<IPubParams>, accountId: string) => void
  setAccountAllParams: (params: Partial<IPubParams>) => void
  enqueueUpload: (params: {
    file: File | Blob
    fileName: string
    type: UploadTaskTypeEnum
  }) => EnqueueUploadHandle
}

/**
 * AI 同步到编辑器 Hook
 */
export function useAISync({
  pubListChoosed,
  step,
  commonPubParams,
  expandedPubItem,
  openLeft,
  aiAssistantRef,
  setOpenLeft,
  setOnePubParams,
  setAccountAllParams,
  enqueueUpload,
}: UseAISyncParams) {
  /**
   * 处理划词操作
   */
  const handleTextSelection = useCallback(
    (action: AIAction, selectedText: string) => {
      // 只有当面板未打开时才设置，避免重复触发导致状态混乱
      if (!openLeft) {
        setOpenLeft(true)
      }
      // 等待面板打开动画完成后调用AI处理并自动发送
      setTimeout(
        () => {
          aiAssistantRef.current?.processText(selectedText, action)
        },
        openLeft ? 100 : 500,
      ) // 如果已打开，减少延迟
    },
    [openLeft, setOpenLeft, aiAssistantRef],
  )

  /**
   * 处理图生图
   */
  const handleImageToImage = useCallback(
    (imageFile: IImgFile) => {
      // 打开AI面板
      if (!openLeft) {
        setOpenLeft(true)
      }
      // 等待面板打开动画完成后调用图生图功能
      setTimeout(
        () => {
          aiAssistantRef.current?.processImageToImage(imageFile.file, '')
        },
        openLeft ? 100 : 500,
      )
    },
    [openLeft, setOpenLeft, aiAssistantRef],
  )

  /**
   * 同步 AI 内容到编辑器
   */
  const handleSyncToEditor = useCallback(
    async (content: string, images?: IImgFile[], video?: IVideoFile, append?: boolean) => {
      // Handle image upload
      if (images && images.length > 0) {
        const uploadsWithImages: Array<{
          image: IImgFile
          promise: Promise<any>
          cancel: () => void
        }> = []

        for (const image of images) {
          const handle = enqueueUpload({
            file: image.file,
            fileName: image.filename,
            type: UploadTaskTypeEnum.Image,
          })

          const imageWithTask: IImgFile = {
            ...image,
            uploadTaskId: handle.taskId,
          }

          uploadsWithImages.push({
            image: imageWithTask,
            promise: handle.promise,
            cancel: handle.cancel,
          })
        }

        // Use images with uploadTaskId
        images = uploadsWithImages.map(item => item.image)
      }

      // Handle video upload (AI-generated videos already have ossUrl, only need to upload cover)
      if (video) {
        // If video already has ossUrl (AI-generated), only upload cover
        if (video.ossUrl && !video.cover.ossUrl) {
          const coverHandle = enqueueUpload({
            file: video.cover.file,
            fileName: video.cover.filename,
            type: UploadTaskTypeEnum.Image,
          })

          video = {
            ...video,
            uploadTaskIds: {
              cover: coverHandle.taskId,
            },
          }
        }
        // If video doesn't have ossUrl (user uploaded), need to upload both video and cover
        else if (!video.ossUrl) {
          const videoHandle = enqueueUpload({
            file: video.file,
            fileName: video.filename,
            type: UploadTaskTypeEnum.Video,
          })

          const coverHandle = enqueueUpload({
            file: video.cover.file,
            fileName: video.cover.filename,
            type: UploadTaskTypeEnum.Image,
          })

          video = {
            ...video,
            uploadTaskIds: {
              video: videoHandle.taskId,
              cover: coverHandle.taskId,
            },
          }
        }
      }

      // If only one account, update directly
      if (pubListChoosed.length === 1) {
        const params: Partial<IPubParams> = {}
        // Only update content if not empty string
        if (content) {
          // If append mode, append content to existing text
          if (append && pubListChoosed[0].params.des) {
            params.des = `${pubListChoosed[0].params.des}\n${content}`
          }
          else {
            params.des = content
          }
        }
        // Video and images cannot exist simultaneously
        if (video) {
          params.video = video
          // If has video, clear images
          params.images = []
        }
        else if (images && images.length > 0) {
          params.images = images
        }
        setOnePubParams(params, pubListChoosed[0].account.id)
      }
      // If multiple accounts and in step 0, update common params
      else if (pubListChoosed.length >= 2 && step === 0) {
        const params: Partial<IPubParams> = {}
        // Only update content if not empty string
        if (content) {
          // If append mode, append content to existing text
          if (append && commonPubParams.des) {
            params.des = `${commonPubParams.des}\n${content}`
          }
          else {
            params.des = content
          }
        }
        // Video and images cannot exist simultaneously
        if (video) {
          params.video = video
          // If has video, clear images
          params.images = []
        }
        else if (images && images.length > 0) {
          params.images = images
        }
        setAccountAllParams(params)
      }
      // If in step 1 and has expanded item, update that item
      else if (step === 1 && expandedPubItem) {
        const params: Partial<IPubParams> = {}
        // Only update content if not empty string
        if (content) {
          // If append mode, append content to existing text
          if (append && expandedPubItem.params.des) {
            params.des = `${expandedPubItem.params.des}\n${content}`
          }
          else {
            params.des = content
          }
        }
        // Video and images cannot exist simultaneously
        if (video) {
          params.video = video
          // If has video, clear images
          params.images = []
        }
        else if (images && images.length > 0) {
          params.images = images
        }
        setOnePubParams(params, expandedPubItem.account.id)
      }
    },
    [
      pubListChoosed,
      step,
      commonPubParams,
      expandedPubItem,
      setOnePubParams,
      setAccountAllParams,
      enqueueUpload,
    ],
  )

  return {
    handleTextSelection,
    handleImageToImage,
    handleSyncToEditor,
  }
}
