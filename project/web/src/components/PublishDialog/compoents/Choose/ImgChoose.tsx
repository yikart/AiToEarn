import { Button, message, Upload } from "antd";
import { FC, useRef } from "react";
import { RcFile } from "antd/es/upload";
import { formatImg } from "@/components/PublishDialog/PublishDialog.util";
import { IImgFile } from "@/components/PublishDialog/publishDialog.type";

interface ImgChooseProps {
  // 单选就使用单选方法，多选就使用单选方法

  // 单选返回
  onChoose?: (_: IImgFile) => void;
  // 多选返回方法
  onMultipleChoose?: (_: IImgFile[]) => void;
  children?: React.ReactNode;
}

const ImgChoose: FC<ImgChooseProps> = ({
  onChoose,
  onMultipleChoose,
  children,
}) => {
  const chooseCount = useRef<number>(0);
  const fileListRef = useRef<RcFile[]>([]);

  /**
   * 发送上传的事件
   */
  const handleUploadImg = async () => {
    try {
      const tasks: Promise<IImgFile>[] = [];
      for (const file of fileListRef.current) {
        tasks.push(
          formatImg({
            path: file.name,
            blob: file,
          }),
        );
      }
      const imgFiles = await Promise.all(tasks);
      if (onMultipleChoose) {
        onMultipleChoose(imgFiles);
      } else if (onChoose) {
        onChoose(imgFiles[0]);
      }
    } catch (e) {
      message.error("选择图片失败");
      console.error(e);
    }
  };

  return (
    <Upload
      accept="image/*"
      multiple={!!onMultipleChoose}
      beforeUpload={async (file, uploadFileList) => {
        chooseCount.current++;
        fileListRef.current = [...fileListRef.current, file];

        if (chooseCount.current === uploadFileList.length) {
          await handleUploadImg();
          fileListRef.current = [];
          chooseCount.current = 0;
        }

        return Upload.LIST_IGNORE;
      }}
    >
      {children ? (
        <div className="imgChoose" style={{ cursor: "pointer" }}>
          {children}
        </div>
      ) : (
        <Button type="primary">选择图片</Button>
      )}
    </Upload>
  );
};

export default ImgChoose;
