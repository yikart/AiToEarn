/*
 * @Author: nevin
 * @Date: 2025-01-22 21:59:36
 * @LastEditTime: 2025-02-11 21:45:34
 * @LastEditors: nevin
 * @Description: 选择图片
 */
import { Button, message, Upload } from "antd";
import { FC, useRef } from "react";
import { RcFile } from "antd/es/upload";
import { formatImg } from "@/app/[lng]/publish/components/Choose/ImgChoose.util";

interface ImgChooseProps {
  // 单选就使用单选方法，多选就使用单选方法

  // 单选返回
  onChoose?: (_: IImgFile) => void;
  // 多选返回方法
  onMultipleChoose?: (_: IImgFile[]) => void;
  children?: React.ReactNode;
}

export interface IImgFile {
  id: string;
  size: number;
  file: Blob;
  // 前端临时路径，注意不要存到数据库
  imgUrl: string;
  filename: string;
  // 图片在硬盘上的路径
  imgPath: string;
  // 图片宽度
  width: number;
  // 图片高度
  height: number;
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
