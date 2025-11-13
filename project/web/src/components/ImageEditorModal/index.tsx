import type {
  ForwardedRef,
} from 'react'
import type { IImgFile } from '@/components/PublishDialog/publishDialog.type'
// @ts-ignore
import ImageEditor from '@toast-ui/react-image-editor'
import { Button, Modal } from 'antd'
import {
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { uploadToOss } from '@/api/oss'
import { useTransClient } from '@/app/i18n/client'
import zhCNImageEditor from '@/app/i18n/locales/zh-CN/imageEditor.json'
import { formatImg } from '@/components/PublishDialog/PublishDialog.util'
import { useGetClientLng } from '@/hooks/useSystem'
import { dataURLToBlob } from '@/utils'
import { getOssUrl } from '@/utils/oss'
import styles from './imageEditorModal.module.scss'
import 'tui-image-editor/dist/tui-image-editor.css'

export interface IImageEditorModalRef {}
export interface IImageEditorModalProps {
  open: boolean
  onCancel: () => void
  imgFile?: IImgFile
  onOk: (editedImg: IImgFile) => void
}

const ImageEditorModal = memo(
  forwardRef(
    (
      { open, onCancel, imgFile, onOk }: IImageEditorModalProps,
      ref: ForwardedRef<IImageEditorModalRef>,
    ) => {
      const lng = useGetClientLng()
      const { t } = useTransClient('imageEditor')
      const account = useTransClient('account')
      const imageEditorRef = useRef<any>()
      const [uploadLoading, setUploadLoading] = useState(false)
      const isInit = useRef(false)

      const imageEditorLocale = useMemo(() => {
        if (lng === 'en')
          return null
        // 这里用 zhCNImageEditor 的 key 列表动态生成
        return Object.keys(zhCNImageEditor).reduce<Record<string, string>>(
          (acc, key) => {
            acc[key] = t(key as any) // 若缺失则 i18n 会回退为 key
            return acc
          },
          {},
        )
      }, [lng, t])

      useEffect(() => {
        if (open && imgFile) {
          const inst = imageEditorRef.current?.getInstance()
          if (inst) {
            inst.loadImageFromURL(imgFile?.imgUrl, 'lena').then(() => {
              inst.ui.resizeEditor()
            })
          }
        }
      }, [imgFile, open])

      // 添加裁剪预设
      function addCropPreset(newClass: string, label: string, mode: number) {
        if (document.querySelector(`.${newClass}`))
          return
        const originClass = 'preset-16-9'
        const cropCon = document.querySelector('.tie-crop-preset-button')!
        const originPreset = cropCon.querySelector(`.${originClass}`)!
        // 克隆节点并清除所有事件
        const cleanPreset = originPreset.cloneNode(true) as HTMLElement
        const newPreset = cleanPreset.cloneNode(true) as HTMLElement
        newPreset.querySelector('label')!.textContent = label
        newPreset.classList.remove(originClass)
        newPreset.classList.add(newClass)
        cropCon.appendChild(newPreset)
        newPreset.onclick = () => {
          setTimeout(() => {
            const inst = imageEditorRef.current?.getInstance()
            inst.stopDrawingMode()
            inst.startDrawingMode('CROPPER')
            inst.setCropzoneRect(mode)
          }, 10)
        }
      }

      useEffect(() => {
        isInit.current = false
        const timeId = setInterval(() => {
          if (
            !isInit.current
            && document.querySelector('.tie-crop-preset-button')
          ) {
            addCropPreset('preset-4-5', '4:5', 4 / 5)
            addCropPreset('preset-1-1', '1:1', 1)
            addCropPreset('preset-9_1-1', '1.91:1', 1.91)
            clearInterval(timeId)
          }
        }, 100)
      }, [imgFile?.imgUrl])

      return (
        <Modal
          title={t('imageEditing')}
          open={open}
          onCancel={onCancel}
          getContainer={() => document.body}
          width={1100}
          footer={(
            <>
              <Button size="large" onClick={onCancel}>
                {account.t('deleteConfirm.cancel')}
              </Button>
              <Button
                type="primary"
                size="large"
                loading={uploadLoading}
                onClick={async () => {
                  const inst = imageEditorRef.current?.getInstance()
                  if (!inst)
                    return ''
                  setUploadLoading(true)
                  const base64 = inst.toDataURL({ format: 'png', quality: 1 })
                  const blob = dataURLToBlob(base64)
                  const image = await formatImg({
                    blob,
                    path:
                      imgFile?.filename
                      || `aitoearn_edited_image_${Date.now()}.png`,
                  })
                  const uploadCoverRes = await uploadToOss(image.file)
                  image.ossUrl = getOssUrl(uploadCoverRes)
                  setUploadLoading(false)
                  onOk(image)
                  onCancel()
                }}
              >
                {account.t('createSpace.save')}
              </Button>
            </>
          )}
        >
          <div className={styles.imageEditorModal}>
            <ImageEditor
              key={imgFile?.imgUrl}
              ref={imageEditorRef}
              includeUI={{
                ...(imageEditorLocale ? { locale: imageEditorLocale } : {}),
                loadImage: {
                  path: imgFile?.imgUrl,
                  name: 'SampleImage',
                },
                menu: [
                  'crop',
                  'flip',
                  'rotate',
                  'draw',
                  'shape',
                  'icon',
                  'text',
                  'filter',
                ],
                uiSize: { width: '1000px', height: '700px' },
                menuBarPosition: 'bottom',
              }}
              cssMaxHeight={430}
              cssMaxWidth={800}
              selectionStyle={{ cornerSize: 20, rotatingPointOffset: 70 }}
              usageStatistics={false}
            />
          </div>
        </Modal>
      )
    },
  ),
)

export default ImageEditorModal
