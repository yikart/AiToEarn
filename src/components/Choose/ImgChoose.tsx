/*
 * @Author: nevin
 * @Date: 2025-01-22 21:59:36
 * @LastEditTime: 2025-02-11 21:45:34
 * @LastEditors: nevin
 * @Description: 选择图片
 */
import { Button, message } from 'antd';
import { FC } from 'react';
import { getFilePathName } from '@/utils';
import { icpGetFileStream } from '@/icp/view';

interface ImgChooseProps {
  // 单选就使用单选方法，多选就使用单选方法

  // 单选返回
  onChoose?: (_: IImgFile) => void;
  // 多选返回方法
  onMultipleChoose?: (_: IImgFile[]) => void;
  children?: React.ReactNode;
}

export interface IImgFile {
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

// 根据图片在硬盘上的路径获取文件
export const getImgFile = async (path: string): Promise<IImgFile> => {
  const file = await icpGetFileStream(path);
  return await formatImg({ path, file });
};

/**
 * 根据图片的Uint8Array和路径获取文件
 * @param path
 * @param file
 * @param blob
 */
export const formatImg = async ({
  path,
  file,
  blob,
}: {
  path: string;
  file?: Uint8Array;
  blob?: Blob;
}): Promise<IImgFile> => {
  return new Promise((resolve) => {
    if (!blob) {
      const filename = getFilePathName(path);
      blob = new Blob([file!], {
        type: `image/${filename.split('.')[filename.split('.').length - 1]}`,
      });
    }
    const imgUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        imgPath: path,
        size: blob!.size,
        filename: getFilePathName(path),
        file: blob!,
        imgUrl,
      });
    };
    img.src = imgUrl;
  });
};

const ImgChoose: FC<ImgChooseProps> = ({
  onChoose,
  onMultipleChoose,
  children,
}) => {
  /**
   * 发送上传的事件
   */
  const handleUploadImg = async () => {
    try {
      const result: {
        path: string;
        file: Uint8Array;
      }[] = await window.ipcRenderer.invoke(
        'ICP_VIEWS_CHOSE_IMG',
        !!onMultipleChoose,
      );
      if (!result) return;
      const tasks: Promise<IImgFile>[] = [];
      for (const v of result) {
        tasks.push(formatImg(v));
      }
      const imgFiles = await Promise.all(tasks);

      if (onMultipleChoose) {
        onMultipleChoose(imgFiles);
      } else if (onChoose) {
        onChoose(imgFiles[0]);
      }
    } catch (error) {
      message.error('选择图片失败');
      console.error(error);
    }
  };

  return (
    <>
      {children ? (
        <div
          className="imgChoose"
          onClick={handleUploadImg}
          style={{ cursor: 'pointer' }}
        >
          {children}
        </div>
      ) : (
        <Button type="primary" onClick={handleUploadImg}>
          选择图片
        </Button>
      )}
    </>
  );
};

export default ImgChoose;
