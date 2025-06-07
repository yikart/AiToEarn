import { KwaiPlat } from "@/app/plat/platChildren/kwai/KwaiPlat";
import { IVideoPublishItem, PublishRes } from "@/app/plat/plat.type";
import { calculateChunks, readBlobRange } from "@/app/plat/plat.util";

class KwaiPubCore {
  kwaiPlat: KwaiPlat;
  videoPubParams: IVideoPublishItem;
  fileBlockSize = 4194304;

  constructor(kwaiPlat: KwaiPlat, pubParams: IVideoPublishItem) {
    this.kwaiPlat = kwaiPlat;
    this.videoPubParams = pubParams;
  }

  // 视频发布
  async publishVideo(): Promise<PublishRes> {
    const startUploadInfo = await this.startUploadVideo();
    // 获取分片的大小
    const chunkRange = calculateChunks(
      this.videoPubParams.video.size,
      this.fileBlockSize,
    );

    // 分片上传
    for (let i = 0; i < chunkRange.length; i++) {
      const range = chunkRange[i];
      // 获取要上传的视频分片
      const chunk = await readBlobRange(
        this.videoPubParams.video.file,
        range.start,
        range.end,
      );
      // 发起分片上传
      const chunkUploadRes = await this.kwaiPlat.request({
        url: `/kuaishoUploadApi/api/upload/fragment`,
        method: "POST",
        params: {
          fragment_id: i,
          upload_token: startUploadInfo.upload_token,
        },
        data: chunk,
      });
      if (chunkUploadRes.result !== 1) {
        throw new Error("分片上传失败！");
      }
      console.log(
        `${i} / ${chunkRange.length} 分片上传结果：${chunkUploadRes}`,
      );
    }

    // 分片上传完成
    const completeRes = await this.kwaiPlat.request({
      url: `/kuaishoUploadApi/api/upload/complete`,
      method: "POST",
      params: {
        fragment_count: chunkRange.length,
        upload_token: startUploadInfo.upload_token,
      },
    });

    const formData = new FormData();
    const pubRes = await this.kwaiPlat.request({
      url: "/kuaishoApi/openapi/photo/publish",
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: {
        upload_token: startUploadInfo.upload_token,
      },
      data: formData,
    });
  }

  // 发起上传
  async startUploadVideo() {
    const res = await this.kwaiPlat.request({
      url: "openapi/photo/start_upload",
      method: "GET",
    });
    return res.data as {
      result: number;
      upload_token: string;
      endpoint: string;
    };
  }
}
