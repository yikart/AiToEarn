import { RcFile } from "antd/es/upload";
import {
  IImgFile,
  IVideoFile,
} from "@/components/PublishDialog/publishDialog.type";
import { generateUUID, getFilePathName } from "@/utils";

export const formatVideo = async (file: RcFile): Promise<IVideoFile> => {
  const videoUrl = URL.createObjectURL(file);
  const videoInfo = await VideoGrabFrame(videoUrl, 0);

  return {
    filename: file.name,
    videoUrl,
    size: file.size!,
    file: file,
    ...videoInfo,
  };
};

export function VideoGrabFrame(
  videoUrl: string,
  currentTime: number,
): Promise<{
  width: number;
  height: number;
  // 下取整的时长
  duration: number;
  // 视频首帧
  cover: IImgFile;
}> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = videoUrl;

    // 当视频元数据加载完毕时执行回调
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = currentTime;
    });

    video.addEventListener("seeked", function () {
      // 获取视频的宽度和高度
      const width = video.videoWidth;
      const height = video.videoHeight;
      // 获取视频的时长
      const duration = video.duration;

      // 获取视频首帧
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d")!;
      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);
      context.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        const cover = await formatImg({
          blob: blob!,
          path: `cover.${blob!.type.split("/")[1]}`,
        });
        resolve({
          width,
          height,
          duration: Math.floor(duration),
          cover,
        });
        video.remove();
      });
    });

    // 加载视频
    video.load();
  });
}

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
    const { filename, suffix } = getFilePathName(path);
    if (!blob) {
      // @ts-ignore
      blob = new Blob([file!], {
        type: `image/${suffix}`,
      });
    }
    const imgUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      resolve({
        id: generateUUID(),
        width: img.width,
        height: img.height,
        imgPath: path,
        size: blob!.size,
        filename,
        file: blob!,
        imgUrl,
      });
    };
    img.src = imgUrl;
  });
};
