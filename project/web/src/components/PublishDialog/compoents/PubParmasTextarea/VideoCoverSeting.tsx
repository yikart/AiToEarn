import type {
  ForwardedRef,
} from 'react'
import type {
  IImgFile,
  IVideoFile,
} from '@/components/PublishDialog/publishDialog.type'
import { Alert, Button, Modal, Slider, Spin } from 'antd'
import Cropper from 'cropperjs'
import {
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from 'react'
import { uploadToOss } from '@/api/oss'
import ImgChoose from '@/components/PublishDialog/compoents/Choose/ImgChoose'
import {
  formatImg,
  VideoGrabFrame,
} from '@/components/PublishDialog/PublishDialog.util'
import { getOssUrl } from '@/utils/oss'
import styles from './videoCoverSeting.module.scss'
import 'cropperjs/dist/cropper.css'

export interface IVideoCoverSetingRef {}

export interface IVideoCoverSetingProps {
  // 封面选择完成
  onChoosed: (imgFile: IImgFile) => void
  // 当前选择的封面
  value?: IImgFile
  // 需要截帧的视频
  videoFile?: IVideoFile
  // 保存图片的唯一值
  saveImgId?: string
  // 关闭按钮点击事件，如果有这个事件就会显示关闭按钮
  onClose: () => void
  videoCoverSetingModal: boolean
}

// 视频封面设置
const VideoCoverSeting = memo(
  forwardRef(
    (
      {
        videoCoverSetingModal,
        onChoosed,
        value,
        videoFile,
        saveImgId = '',
        onClose,
      }: IVideoCoverSetingProps,
      ref: ForwardedRef<IVideoCoverSetingRef>,
    ) => {
      const [imgFile, setImgFile] = useState<IImgFile>()
      const cropper = useRef<Cropper>()
      const cropperImg = useRef<HTMLImageElement>(null)
      const [videoCoverLoading, setVideoCoverLoading] = useState(false)
      const [sliderVal, setSliderVal] = useState(0)
      const [uploadLoing, setUploadLoing] = useState(false)

      useEffect(() => {
        if (!videoCoverSetingModal)
          return
        if (value) {
          setImgFile(value)
          return
        }
        getVideoCover(0)
      }, [videoCoverSetingModal])

      useEffect(() => {
        if (!imgFile)
          return
        initCropper()
      }, [imgFile])

      /* 获取封面 */
      const getVideoCover = async (n: number) => {
        setVideoCoverLoading(true)
        const videoInfo = await VideoGrabFrame(videoFile!.videoUrl, n)
        setImgFile(videoInfo.cover)
        setVideoCoverLoading(false)
      }

      const close = () => {
        onClose()
      }

      // 初始化裁剪工具
      const initCropper = () => {
        if (!cropperImg.current)
          return

        if (cropper.current) {
          cropper.current.destroy()
          cropper.current = undefined
        }

        cropper.current = new Cropper(cropperImg.current!, {
          viewMode: 2,
          zoomable: false,
          minCropBoxWidth: 100,
          minCropBoxHeight: 100,
          ready() {
            cropper.current!.setCropBoxData({
              left: 0,
              top: 0,
              width: cropperImg.current!.naturalWidth,
              height: cropperImg.current!.naturalHeight,
            })
          },
        })
      }

      return (
        <>
          <Modal
            width={600}
            title="设置封面"
            maskClosable={false}
            open={videoCoverSetingModal}
            onCancel={close}
            footer={(
              <>
                <Button onClick={close}>取消</Button>
                <Button
                  loading={uploadLoing}
                  type="primary"
                  onClick={async () => {
                    setUploadLoing(true)
                    const canvas = cropper.current!.getCroppedCanvas()
                    canvas.toBlob(async (blob) => {
                      const cover = await formatImg({
                        blob: blob!,
                        path: `${saveImgId}.${imgFile?.file.type.split('/')[1]}`,
                      })
                      // 上传封面
                      const uploadCoverRes = await uploadToOss(
                        cover.file,
                      )
                      cover.ossUrl = getOssUrl(uploadCoverRes)
                      setUploadLoing(false)
                      onChoosed(cover)
                      close()
                    }, 'image/png')
                  }}
                >
                  确定
                </Button>
              </>
            )}
          >
            <Spin spinning={videoCoverLoading}>
              <div className={styles.videoCoverSetingModal}>
                <div className="videoCoverSetingModal-top">
                  <Alert
                    message="支持常用图片格式上传，暂不支持 GIF，上传后图片将按平台要求自动裁剪"
                    type="info"
                    showIcon
                  />
                  <ImgChoose
                    onChoose={(imgFile) => {
                      if (!imgFile)
                        return
                      setImgFile(imgFile)
                    }}
                  >
                    <Button>本地上传</Button>
                  </ImgChoose>
                </div>

                <div className="videoCoverSetingModal-cropper">
                  <img
                    style={{ opacity: imgFile?.imgUrl ? '1' : '0' }}
                    ref={cropperImg}
                    src={imgFile?.imgUrl || '/'}
                  />
                </div>

                <Slider
                  value={sliderVal}
                  style={{ margin: '50px 0' }}
                  step={1}
                  min={0}
                  max={videoFile?.duration}
                  onChange={setSliderVal}
                  onChangeComplete={getVideoCover}
                />
              </div>
            </Spin>
          </Modal>
        </>
      )
    },
  ),
)
VideoCoverSeting.displayName = 'VideoCoverSeting'

export default VideoCoverSeting
