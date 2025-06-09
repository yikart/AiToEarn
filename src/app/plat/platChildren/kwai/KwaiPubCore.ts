import { KwaiPlat } from "@/app/plat/platChildren/kwai/KwaiPlat";
import {
  IPublishResult,
  IVideoPublishItem,
  PubProgressType,
} from "@/app/plat/plat.type";
import { calculateChunks, readBlobRange } from "@/app/plat/plat.util";
import { KwaiApiUploadProxyUrl } from "@/constant";

export class KwaiPubCore {
  private kwaiPlat: KwaiPlat;
  private videoPubParams: IVideoPublishItem;
  private fileBlockSize = 4194304;
  // 发布进度
  private readonly onProgress: PubProgressType;

  constructor(
    kwaiPlat: KwaiPlat,
    pubParams: IVideoPublishItem,
    onProgress: PubProgressType,
  ) {
    this.kwaiPlat = kwaiPlat;
    this.videoPubParams = pubParams;
    this.onProgress = onProgress;
  }

  // 视频发布
  async publishVideo(): Promise<IPublishResult> {
    try {
      const startUploadInfo = await this._startUploadVideo();
      this.onProgress(10, "发起上传完成...");

      // 获取分片的大小
      const chunkRange = calculateChunks(
        this.videoPubParams.video.size,
        this.fileBlockSize,
      );
      this.onProgress(20, "分片大小获取完成...");

      // 分片上传
      for (let i = 0; i < chunkRange.length; i++) {
        this.onProgress(50, `正在分片上传视频：${i} / ${chunkRange.length}`);

        const range = chunkRange[i];
        // 获取要上传的视频分片
        const chunk = await readBlobRange(
          this.videoPubParams.video.file,
          range.start,
          range.end,
        );
        // 发起分片上传
        const chunkUploadRes = await this.kwaiPlat.request(
          {
            url: `${KwaiApiUploadProxyUrl}api/upload/fragment`,
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
            },
            params: {
              fragment_id: i,
              upload_token: startUploadInfo.upload_token,
            },
            body: chunk,
          },
          false,
        );
        if (chunkUploadRes.result !== 1) {
          throw new Error("分片上传失败！");
        }
        console.log(
          `${i} / ${chunkRange.length} 分片上传结果：${chunkUploadRes}`,
        );
      }

      // 分片上传完成
      const completeRes = await this.kwaiPlat.request(
        {
          url: `${KwaiApiUploadProxyUrl}api/upload/complete`,
          method: "POST",
          params: {
            fragment_count: chunkRange.length,
            upload_token: startUploadInfo.upload_token,
          },
        },
        false,
      );
      this.onProgress(70, `正在发布视频...`);
      if (completeRes.result !== 1) {
        throw new Error("分片合并失败！");
      }
      console.log("分片上传完成：", completeRes);

      const formData = new FormData();
      formData.append("caption", " #分享转发 标题1  #推广昨品  ");
      formData.append("cover", this.videoPubParams.cover!.file);
      const pubRes = await this.kwaiPlat.request({
        url: "/openapi/photo/publish",
        method: "POST",
        params: {
          upload_token: startUploadInfo.upload_token,
        },
        data: formData,
      });
      if (pubRes.result !== 1) {
        throw new Error(`视频发布失败：${pubRes.error}`);
      }

      return {
        worksId: "",
        worksUrl: "",
        success: true,
      };
    } catch (e) {
      console.error(e);
      return {
        worksId: "",
        worksUrl: "",
        success: false,
        failMsg: e instanceof Error ? e.message : "未知错误",
      };
    }
  }

  // 发起上传
  private async _startUploadVideo() {
    const res = await this.kwaiPlat.request({
      url: "openapi/photo/start_upload",
      method: "POST",
    });
    return res as {
      result: number;
      upload_token: string;
      endpoint: string;
    };
  }
}
