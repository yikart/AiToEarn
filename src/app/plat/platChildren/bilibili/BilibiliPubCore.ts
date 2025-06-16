import { BilibiliPlat } from "@/app/plat/platChildren/bilibili/BilibiliPlat";
import {
  IPublishResult,
  IVideoPublishItem,
  PubProgressType,
} from "@/app/plat/plat.type";
import { calculateChunks, readBlobRange } from "@/app/plat/plat.util";
import { KwaiApiUploadProxyUrl } from "@/constant";

export class BilibiliPubCore {
  private kwaiPlat: BilibiliPlat;
  private videoPubParams: IVideoPublishItem;
  private fileBlockSize = 4194304;
  // 发布进度
  private readonly onProgress: PubProgressType;

  constructor(
    kwaiPlat: BilibiliPlat,
    pubParams: IVideoPublishItem,
    onProgress: PubProgressType,
  ) {
    this.kwaiPlat = kwaiPlat;
    this.videoPubParams = pubParams;
    this.onProgress = onProgress;
  }

  // 获取caption
  getCaption() {
    const { title, describe, topics } = this.videoPubParams;
    let caption = "";
    if (title) {
      caption += `${title} `;
    }

    if (describe) {
      caption += `${describe} `;
    }

    if (topics?.length !== 0) {
      for (const topic of topics!) {
        caption += `#${topic} `;
      }
    }

    return caption.trim();
  }

  // 视频发布
  async publishVideo(): Promise<IPublishResult> {
    console.log("视频发布");
    console.log(this.videoPubParams);
    console.log(this.kwaiPlat.account);
    return {
      worksId: "",
      worksUrl: "",
      success: true,
    };


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
