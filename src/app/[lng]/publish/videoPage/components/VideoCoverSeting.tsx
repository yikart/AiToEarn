import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import ImgChoose, { IImgFile } from "../../components/Choose/ImgChoose";
import styles from "./videoCoverSeting.module.scss";
import { Alert, Button, message, Modal, Slider, Spin } from "antd";
import { IVideoFile } from "../../components/Choose/VideoChoose";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { useVideoPageStore } from "@/app/[lng]/publish/videoPage/useVideoPageStore";
import { useShallow } from "zustand/react/shallow";
import { CloseCircleOutlined } from "@ant-design/icons";
import { formatImg } from "@/app/[lng]/publish/components/Choose/ImgChoose.utils";

export interface IVideoCoverSetingRef {}

export interface IVideoCoverSetingProps {
  // 封面选择完成
  onChoosed: (imgFile: IImgFile) => void;
  // 当前选择的封面
  value?: IImgFile;
  // 需要截帧的视频
  videoFile?: IVideoFile;
  // 保存图片的唯一值
  saveImgId: string;
  // 关闭按钮点击事件，如果有这个事件就会显示关闭按钮
  onClose?: () => void;
}

// 保存裁剪的图片
const saveCropperImage = (filename: string, file: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async function (event) {
      const arrayBuffer = event.target!.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      // TODO 报错裁剪的图片
      // const imgPath = await icpSaveFile({
      //   file: uint8Array,
      //   saveDir: "/images/cropper",
      //   filename: filename,
      // });
      // resolve(imgPath);
    };
    reader.readAsArrayBuffer(file);
  });
};

// 视频封面设置
const VideoCoverSeting = memo(
  forwardRef(
    (
      {
        onChoosed,
        value,
        videoFile,
        saveImgId,
        onClose,
      }: IVideoCoverSetingProps,
      ref: ForwardedRef<IVideoCoverSetingRef>,
    ) => {
      const [imgFile, setImgFile] = useState<IImgFile>();
      const [videoCoverSetingModal, setVideoCoverSetingModal] = useState(false);
      const cropper = useRef<Cropper>();
      const cropperImg = useRef<HTMLImageElement>(null);
      const [videoCoverLoading, setVideoCoverLoading] = useState(false);
      const [sliderVal, setSliderVal] = useState(0);
      const { operateId } = useVideoPageStore(
        useShallow((state) => ({
          operateId: state.operateId,
        })),
      );

      useEffect(() => {
        if (!videoCoverSetingModal) return;
        if (value) {
          setImgFile(value);
          return;
        }
        getVideoCover(0);
      }, [videoCoverSetingModal]);

      useEffect(() => {
        if (!imgFile) return;
        initCropper();
      }, [imgFile]);

      /* 获取封面 */
      const getVideoCover = async (n: number) => {
        // TODO 读取文件
        // if (!videoFile!.videoPath) return;
        // setSliderVal(n);
        // setVideoCoverLoading(true);
        // const pathVideo = await ipcGetVideoCover(
        //   videoFile!.videoPath!,
        //   formatSeconds(n),
        // );
        // const imgFile = await getImgFile(pathVideo);
        // setVideoCoverLoading(false);
        // setImgFile(imgFile);
      };

      const close = () => {
        setVideoCoverSetingModal(false);
      };

      // 初始化裁剪工具
      const initCropper = () => {
        if (!cropperImg.current) return;

        if (cropper.current) {
          cropper.current.destroy();
          cropper.current = undefined;
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
            });
          },
        });
      };

      return (
        <>
          <div
            className={styles.videoCoverSeting}
            onClick={() => {
              if (!videoFile) return message.warning("您必须上传一个视频！");
              setVideoCoverSetingModal(true);
            }}
          >
            <div className="videoCoverSeting-img">
              {value && (
                <div className="videoCoverSeting-choosed">
                  <img src={value?.imgUrl} />
                  {onClose && (
                    <CloseCircleOutlined
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                    />
                  )}
                </div>
              )}
            </div>
            <div className="videoCoverSeting-text">上传图片</div>
          </div>

          <Modal
            width={600}
            title="设置封面"
            maskClosable={false}
            open={videoCoverSetingModal}
            onCancel={close}
            onOk={async () => {
              const canvas = cropper.current!.getCroppedCanvas();
              canvas.toBlob(async function (blob) {
                const imgPath = await saveCropperImage(
                  `${operateId}_${saveImgId}.${imgFile?.file.type.split("/")[1]}`,
                  blob!,
                );
                const cover = await formatImg({
                  blob: blob!,
                  path: imgPath,
                });
                onChoosed(cover);
                close();
              }, "image/png");
            }}
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
                      if (!imgFile) return;
                      setImgFile(imgFile);
                    }}
                  >
                    <Button>本地上传</Button>
                  </ImgChoose>
                </div>

                <div className="videoCoverSetingModal-cropper">
                  <img
                    style={{ opacity: imgFile?.imgUrl ? "1" : "0" }}
                    ref={cropperImg}
                    src={imgFile?.imgUrl || "/"}
                  />
                </div>

                <Slider
                  value={sliderVal}
                  style={{ margin: "50px 0" }}
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
      );
    },
  ),
);
VideoCoverSeting.displayName = "VideoCoverSeting";

export default VideoCoverSeting;
