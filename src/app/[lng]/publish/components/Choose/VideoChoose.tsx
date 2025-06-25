/*
 * @Author: nevin
 * @Date: 2025-01-22 21:59:36
 * @LastEditTime: 2025-01-23 15:40:37
 * @LastEditors: nevin
 * @Description: 选择视频
 */
import { Button, message, Upload } from "antd";
import { FC, useRef } from "react";
import { IImgFile } from "@/app/[lng]/publish/components/Choose/ImgChoose";
import { RcFile } from "antd/es/upload";
import {
  formatVideo,
  VideoGrabFrame,
} from "@/app/[lng]/publish/components/Choose/videoChoose.util";

interface VideoChooseProps {
  // 单选就使用单选方法，多选就使用单选方法

  // 单选返回
  onChoose?: (videoFile: IVideoFile) => void;
  // 多选返回方法
  onMultipleChoose?: (videoFiles: IVideoFile[]) => void;
  children?: React.ReactNode;
  // 开始选择
  onStartShoose?: () => void;
  onChooseFail?: () => void;
}

export interface IVideoFile {
  size: number;
  file: Blob;
  // 前端临时路径，注意不要存到数据库
  videoUrl: string;
  filename: string;
  // 视频宽度
  width: number;
  // 视频高度
  height: number;
  // 视频下取整的时长,单位秒
  duration: number;
  // 视频首帧图片
  cover: IImgFile;
}

async function getVideoInfo(videoUrl: string): Promise<{
  width: number;
  height: number;
  // 下取整的时长
  duration: number;
  // 视频首帧
  cover: IImgFile;
}> {
  return await VideoGrabFrame(videoUrl, 0);
}

// 根据视频的Uint8Array和路径获取文件
// export const formatVideo = async (
//   path: string,
//   file: Uint8Array,
// ): Promise<IVideoFile> => {
//   const { filename, suffix } = getFilePathName(path);
//   const blob = new Blob([file], { type: `video/${suffix}` });
//   const videoUrl = URL.createObjectURL(blob);
//
//   const videoInfo = await getVideoInfo(videoUrl, filename);
//   return {
//     videoPath: path,
//     size: file.length,
//     filename,
//     file: blob,
//     videoUrl,
//     ...videoInfo,
//   };
// };

const VideoChoose: FC<VideoChooseProps> = ({
  onChoose,
  onMultipleChoose,
  children,
  onStartShoose,
  onChooseFail,
}) => {
  const chooseCount = useRef<number>(0);
  const fileListRef = useRef<RcFile[]>([]);

  /**
   * 发送上传的事件
   */
  const handleUploadVideo = async () => {
    try {
      const tasks: Promise<IVideoFile>[] = [];
      for (const file of fileListRef.current) {
        tasks.push(formatVideo(file));
      }
      const videoFiles = await Promise.all(tasks);

      if (onMultipleChoose) {
        onMultipleChoose(videoFiles);
      } else if (onChoose) {
        onChoose(videoFiles[0]);
      }
    } catch (e) {
      message.error("选择视频失败");
      console.error(e);
    }
  };

  return (
    <Upload
      accept=".mp4"
      multiple={!!onMultipleChoose}
      beforeUpload={async (file, uploadFileList) => {
        chooseCount.current++;
        fileListRef.current = [...fileListRef.current, file];

        if (chooseCount.current === uploadFileList.length) {
          handleUploadVideo();
          fileListRef.current = [];
          chooseCount.current = 0;
        }

        return Upload.LIST_IGNORE;
      }}
    >
      {children ? (
        <div className="videoChoose" style={{ cursor: "pointer" }}>
          {children}
        </div>
      ) : (
        <Button type="primary">选择视频</Button>
      )}
    </Upload>
  );
};

export default VideoChoose;
