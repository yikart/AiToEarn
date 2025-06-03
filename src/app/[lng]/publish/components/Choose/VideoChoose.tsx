/*
 * @Author: nevin
 * @Date: 2025-01-22 21:59:36
 * @LastEditTime: 2025-01-23 15:40:37
 * @LastEditors: nevin
 * @Description: 选择视频
 */
import { Button } from "antd";
import { FC } from "react";
import { getFilePathName } from "@/utils";
import { IImgFile } from "@/app/[lng]/publish/components/Choose/ImgChoose";
// import { saveCropperImage } from "@/views/publish/children/videoPage/components/VideoCoverSeting";

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
  // 视频在硬盘上的路径
  videoPath: string;
  // 视频宽度
  width: number;
  // 视频高度
  height: number;
  // 视频下取整的时长,单位秒
  duration: number;
  // 视频首帧图片
  cover: IImgFile;
}

function getVideoInfo(
  videoUrl: string,
  fileName: string,
): Promise<{
  width: number;
  height: number;
  // 下取整的时长
  duration: number;
  // 视频首帧
  cover: IImgFile;
}> {
  return new Promise((resolve) => {
    // TODO 截帧
    // // 创建一个临时的 video 元素
    // const video = document.createElement("video");
    //
    // // 设置 video 元素的 src 属性
    // video.src = videoUrl;
    //
    // // 当视频元数据加载完毕时执行回调
    // video.addEventListener("loadedmetadata", () => {
    //   video.currentTime = 0;
    // });
    //
    // video.addEventListener("seeked", function () {
    //   // 获取视频的宽度和高度
    //   const width = video.videoWidth;
    //   const height = video.videoHeight;
    //   // 获取视频的时长
    //   const duration = video.duration;
    //
    //   // 获取视频首帧
    //   const canvas = document.createElement("canvas");
    //   canvas.width = width;
    //   canvas.height = height;
    //   const context = canvas.getContext("2d")!;
    //   context.fillStyle = "white";
    //   context.fillRect(0, 0, width, height);
    //   context.drawImage(video, 0, 0);
    //   canvas.toBlob(async (blob) => {
    //     const imgPath = await saveCropperImage(
    //       `${fileName}.${blob!.type.split("/")[1]}`,
    //       blob!,
    //     );
    //     const cover = await formatImg({
    //       blob: blob!,
    //       path: imgPath,
    //     });
    //     resolve({
    //       width,
    //       height,
    //       duration: Math.floor(duration),
    //       cover,
    //     });
    //     video.remove();
    //   });
    // });
    // // 加载视频
    // video.load();
  });
}

// 根据视频的Uint8Array和路径获取文件
export const formatVideo = async (
  path: string,
  file: Uint8Array,
): Promise<IVideoFile> => {
  const { filename, suffix } = getFilePathName(path);
  const blob = new Blob([file], { type: `video/${suffix}` });
  const videoUrl = URL.createObjectURL(blob);

  const videoInfo = await getVideoInfo(videoUrl, filename);
  return {
    videoPath: path,
    size: file.length,
    filename,
    file: blob,
    videoUrl,
    ...videoInfo,
  };
};

const VideoChoose: FC<VideoChooseProps> = ({
  onChoose,
  onMultipleChoose,
  children,
  onStartShoose,
  onChooseFail,
}) => {
  /**
   * 发送上传的事件
   */
  const handleUploadVideo = async () => {
    // TODO 上传视频
    // try {
    //   // if (onStartShoose) onStartShoose();
    //   const result: {
    //     path: string;
    //     video: Uint8Array;
    //   }[] = await window.ipcRenderer.invoke(
    //     "ICP_VIEWS_CHOSE_VIDEO",
    //     !!onMultipleChoose,
    //   );
    //   if (!result) {
    //     // if (onChooseFail) onChooseFail();
    //     return;
    //   }
    //   if (onStartShoose) onStartShoose();
    //
    //   const tasks: Promise<IVideoFile>[] = [];
    //   for (const v of result) {
    //     tasks.push(formatVideo(v.path, v.video));
    //   }
    //   const videoFiles = await Promise.all(tasks);
    //
    //   if (onMultipleChoose) {
    //     onMultipleChoose(videoFiles);
    //   } else if (onChoose) {
    //     onChoose(videoFiles[0]);
    //   }
    // } catch (error) {
    //   message.error("选择视频失败");
    //   console.error(error);
    // }
  };

  return (
    <>
      {children ? (
        <div
          className="videoChoose"
          onClick={handleUploadVideo}
          style={{ cursor: "pointer" }}
        >
          {children}
        </div>
      ) : (
        <Button type="primary" onClick={handleUploadVideo}>
          选择视频
        </Button>
      )}
    </>
  );
};

export default VideoChoose;
