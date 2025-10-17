import {
  ForwardedRef,
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// @ts-ignore
import ImageEditor from "@toast-ui/react-image-editor";
import "tui-image-editor/dist/tui-image-editor.css";
import { Button, Modal } from "antd";
import styles from "./imageEditorModal.module.scss";
import { IImgFile } from "@/components/PublishDialog/publishDialog.type";
import { useGetClientLng } from "@/hooks/useSystem";
import { useTransClient } from "@/app/i18n/client";
import zhCNImageEditor from "@/app/i18n/locales/zh-CN/imageEditor.json";
import { formatImg } from "@/components/PublishDialog/PublishDialog.util";
import { dataURLToBlob } from "@/utils";
import { toolsApi } from "@/api/tools";
import { OSS_URL } from "@/constant";

export interface IImageEditorModalRef {}
export interface IImageEditorModalProps {
  open: boolean;
  onCancel: () => void;
  imgFile: IImgFile;
  onOk: (editedImg: IImgFile) => void;
}

const ImageEditorModal = memo(
  forwardRef(
    (
      { open, onCancel, imgFile, onOk }: IImageEditorModalProps,
      ref: ForwardedRef<IImageEditorModalRef>,
    ) => {
      const lng = useGetClientLng();
      const { t } = useTransClient("imageEditor");
      const imageEditorRef = useRef<any>();
      const [uploadLoading, setUploadLoading] = useState(false);

      const imageEditorLocale = useMemo(() => {
        if (lng === "en") return undefined;
        // 这里用 zhCNImageEditor 的 key 列表动态生成
        return Object.keys(zhCNImageEditor).reduce<Record<string, string>>(
          (acc, key) => {
            acc[key] = t(key as any); // 若缺失则 i18n 会回退为 key
            return acc;
          },
          {},
        );
      }, [lng, t]);

      useEffect(() => {
        if (open) {
          const inst = imageEditorRef.current?.getInstance();
          if (inst) {
            inst.loadImageFromURL(imgFile.imgUrl, "lena").then(() => {
              inst.ui.resizeEditor();
            });
          }
        }
      }, [imgFile, open]);

      return (
        <Modal
          title={"图像编辑"}
          open={open}
          onCancel={onCancel}
          width={1100}
          footer={
            <>
              <Button size="large" onClick={onCancel}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                loading={uploadLoading}
                onClick={async () => {
                  const inst = imageEditorRef.current?.getInstance();
                  if (!inst) return "";
                  setUploadLoading(true);
                  const base64 = inst.toDataURL({ format: "png", quality: 1 });
                  const blob = dataURLToBlob(base64);
                  const image = await formatImg({
                    blob: blob,
                    path:
                      imgFile.filename ||
                      `aitoearn_edited_image_${Date.now()}.png`,
                  });
                  const uploadCoverRes = await toolsApi.uploadFileTemp(
                    image.file,
                  );
                  image["ossUrl"] = `${OSS_URL}${uploadCoverRes}`;
                  setUploadLoading(false);
                  onOk(image);
                }}
              >
                保存
              </Button>
            </>
          }
        >
          <div className={styles.imageEditorModal}>
            <ImageEditor
              ref={imageEditorRef}
              includeUI={{
                locale: imageEditorLocale,
                loadImage: {
                  path: imgFile.imgUrl,
                  name: "SampleImage",
                },
                menu: [
                  "crop",
                  "flip",
                  "rotate",
                  "draw",
                  "shape",
                  "icon",
                  "text",
                  "filter",
                ],
                uiSize: { width: "1000px", height: "700px" },
                menuBarPosition: "bottom",
              }}
              cssMaxHeight={500}
              cssMaxWidth={700}
              selectionStyle={{ cornerSize: 20, rotatingPointOffset: 70 }}
              usageStatistics={false}
            />
          </div>
        </Modal>
      );
    },
  ),
);

export default ImageEditorModal;
