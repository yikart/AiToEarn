import type { MenuProps } from 'antd'
import type { RcFile } from 'antd/es/upload'
import type { UploadRef } from 'antd/es/upload/Upload'
import type {
  ForwardedRef,
} from 'react'
import type { UploadResult } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload.type'
import type {
  IImgFile,
  IVideoFile,
} from '@/components/PublishDialog/publishDialog.type'
import { PlusOutlined } from '@ant-design/icons'
import { Dropdown, Upload } from 'antd'
import React, {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTransClient } from '@/app/i18n/client'
import MaterialSelectionModal from '@/components/PublishDialog/compoents/MaterialSelectionModal'
import { UploadTaskTypeEnum } from '@/components/PublishDialog/compoents/PublishManageUpload/publishManageUpload.enum'
import { usePublishManageUpload } from '@/components/PublishDialog/compoents/PublishManageUpload/usePublishManageUpload'
import {
  formatImg,
  formatVideo,
  VideoGrabFrame,
} from '@/components/PublishDialog/PublishDialog.util'
import { OSS_URL } from '@/constant'
import { toast } from '@/lib/toast'
import { getOssUrl } from '@/utils/oss'

const { Dragger } = Upload

export interface IPubParmasTextareaUploadRef {}

export interface IPubParmasTextareaUploadProps {
  uploadAccept: string
  checkFileListType: (fileList: File[]) => boolean
  onVideoUpdateFinish: (video: IVideoFile) => void
  onImgUpdateFinish: (img: IImgFile[]) => void
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
      const chooseCount = useRef<number>(0)
      const fileListRef = useRef<RcFile[]>([])
      const { t } = useTransClient('publish')
      const uploadRef = useRef<UploadRef>(null)
      const [materialSelectionOpen, setMaterialSelectionOpen] = useState(false)
      const enqueueUpload = usePublishManageUpload(
        state => state.enqueueUpload,
      )

      const isAbortError = useCallback((error: unknown) => {
        if (error instanceof DOMException) {
          return error.name === 'AbortError'
        }
        return Boolean((error as { name?: string })?.name === 'AbortError')
      }, [])

      // 上传视频
      const uploadVideo = useCallback(
        async (video: IVideoFile) => {
          const videoHandle = enqueueUpload({
            file: video.file,
            fileName: video.filename,
            type: UploadTaskTypeEnum.Video,
          })
          const coverHandle = enqueueUpload({
            file: video.cover.file,
            fileName: video.cover.filename,
            type: UploadTaskTypeEnum.VideoCover,
          })

          const videoWithTasks: IVideoFile = {
            ...video,
            cover: {
              ...video.cover,
              uploadTaskId: coverHandle.taskId,
            },
            uploadTaskIds: {
              video: videoHandle.taskId,
              cover: coverHandle.taskId,
            },
          }

          onVideoUpdateFinish(videoWithTasks)

          try {
            const [videoResult, coverResult] = await Promise.all([
              videoHandle.promise,
              coverHandle.promise,
            ])

            onVideoUpdateFinish({
              ...videoWithTasks,
              ossUrl: videoResult.ossUrl,
              cover: {
                ...videoWithTasks.cover,
                ossUrl: coverResult.ossUrl,
              },
            })
          }
          catch (error) {
            if (!isAbortError(error)) {
              console.error(error)
              toast.error('上传失败，请稍后重试')
              videoHandle.cancel()
              coverHandle.cancel()
            }
          }
        },
        [enqueueUpload, isAbortError, onVideoUpdateFinish],
      )

      // 上传图片
      const uploadImg = useCallback(
        async (fileList: RcFile[]) => {
          const uploads: Array<{
            image: IImgFile
            promise: Promise<UploadResult>
            cancel: () => void
          }> = []

          for (const file of fileList) {
            const image = await formatImg({
              blob: file!,
              path: file.name,
            })

            const handle = enqueueUpload({
              file: image.file,
              fileName: image.filename,
              type: UploadTaskTypeEnum.Image,
            })

            const imageWithTask: IImgFile = {
              ...image,
              uploadTaskId: handle.taskId,
            }

            uploads.push({
              image: imageWithTask,
              promise: handle.promise,
              cancel: handle.cancel,
            })
          }

          if (uploads.length) {
            onImgUpdateFinish(uploads.map(item => item.image))
          }

          uploads.forEach(({ image, promise, cancel }) => {
            promise
              .then((result) => {
                onImgUpdateFinish([
                  {
                    ...image,
                    ossUrl: result.ossUrl,
                  },
                ])
              })
              .catch((error) => {
                if (!isAbortError(error)) {
                  console.error(error)
                  toast.error('上传失败，请稍后重试')
                  cancel()
                }
              })
          })
        },
        [enqueueUpload, isAbortError, onImgUpdateFinish],
      )

      const dropdownItems: MenuProps['items'] = useMemo(() => {
        return [
          {
            key: '1',
            label: (
              <a
                onClick={() => {
                  // 触发上传
                  uploadRef
                    .current!.nativeElement?.querySelector('input')!
                    .click()
                }}
              >
                {t('upload.uploadLocal')}
              </a>
            ),
          },
          {
            key: '2',
            label: (
              <a onClick={() => setMaterialSelectionOpen(true)}>
                {t('actions.selectMaterial')}
              </a>
            ),
          },
        ]
      }, [t])

      return (
        <div
          className="pubParmasTextarea-uploads-upload"
          onClick={e => e.stopPropagation()}
        >
          <MaterialSelectionModal
            onCancel={() => setMaterialSelectionOpen(false)}
            libraryModalOpen={materialSelectionOpen}
            allowImage={uploadAccept.includes('image')}
            allowVideo={uploadAccept.includes('video')}
            onSelected={async (item) => {
              const ossUrl = getOssUrl(item.url)
              try {
                if (item.type === 'img') {
                  // 图片素材，下载
                  const req = await fetch(
                    ossUrl.replace(OSS_URL, '/ossProxy/'),
                  )
                  const blob = await req.blob()
                  const imagefile = await formatImg({
                    blob,
                    path: `${item.title || 'image'}.${blob.type.split('/')[1]}`,
                  })
                  imagefile.ossUrl = item.url
                  onImgUpdateFinish([imagefile])
                }
                else {
                  const videoInfo = await VideoGrabFrame(ossUrl, 0)
                  const video: any = {
                    ossUrl,
                    videoUrl: ossUrl,
                    width: videoInfo.width,
                    height: videoInfo.height,
                    duration: videoInfo.duration,
                    size: item.metadata.size,
                    cover: videoInfo.cover,
                  }
                  onVideoUpdateFinish(video)
                }
              }
              catch (e) {
                console.error(e)
              }
            }}
          />

          <Dragger
            ref={uploadRef}
            style={{ display: 'none' }}
            accept={uploadAccept}
            multiple={uploadAccept.includes('image')}
            listType="text"
            beforeUpload={async (file, uploadFileList) => {
              if (!checkFileListType(uploadFileList)) {
                return Upload.LIST_IGNORE
              }
              if (file.type.startsWith('video/')) {
                const video = await formatVideo(file)
                await uploadVideo(video)
              }
              else {
                chooseCount.current++
                fileListRef.current = [...fileListRef.current, file]

                if (chooseCount.current === uploadFileList.length) {
                  await uploadImg(fileListRef.current)
                  fileListRef.current = []
                  chooseCount.current = 0
                }
              }
              return false
            }}
            showUploadList={false}
          />

          <Dropdown menu={{ items: dropdownItems }} placement="top">
            <div
              className="pubParmasTextarea-uploads-upload-blocker"
              onClick={() => {
              // 触发上传
                uploadRef
                  .current!.nativeElement?.querySelector('input')!
                  .click()
              }}
            >
              <PlusOutlined style={{ fontSize: '20px' }} />
              {t('upload.selectFile')}
            </div>
          </Dropdown>
        </div>
      )
    },
  ),
)

export default PubParmasTextareaUpload
