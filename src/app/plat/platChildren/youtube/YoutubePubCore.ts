import { YoutubePlat } from "./YoutubePlat";
import {
  IPublishResult,
  IVideoPublishItem,
  PubProgressType,
} from "@/app/plat/plat.type";
import { calculateChunks } from "@/app/plat/plat.util";
import {
  // apiInitBilibiliVideo,
  // apiUploadBilibiliCover,
  // apiSubmitBilibiliArchive,
  // apiUploadBilibiliVideoPart,
  // apiCompleteBilibiliVideo,
  uploadYouTubeVideoSmallApi
} from "@/api/youtube";
import { apiCreatePublish, AccountType, PubStatus } from "@/api/publish";
import { PubType } from "@/app/config/publishConfig";

export class YoutubePubCore {
  private thisPlat: YoutubePlat;
  private videoPubParams: IVideoPublishItem;
  private fileBlockSize = 4194304;
  // 发布进度
  private readonly onProgress: PubProgressType;

  constructor(
    thisPlat: YoutubePlat,
    pubParams: IVideoPublishItem,
    onProgress: PubProgressType,
  ) {
    this.thisPlat = thisPlat;
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

  // 创建发布记录
  private async createPublishRecord(result: any, coverUrl: string) {
    try {
      const publishData = {
        flowId: `youtube_${Date.now()}`, // 生成唯一的流程ID
        type: PubType.VIDEO,
        title: this.videoPubParams.title || "",
        desc: this.videoPubParams.describe || "",
        accountId: this.thisPlat.account.id,
        uid: this.thisPlat.account.uid || "",
        accountType: AccountType.YOUTUBE,
        videoUrl: result.worksUrl, // 使用构建的视频地址
        coverUrl: coverUrl, // 使用实际上传的封面地址
        imgList: [],
        publishTime: new Date().toISOString(),
        status: result.success ? PubStatus.RELEASED : PubStatus.FAIL,
        option: {
          worksId: result.worksId,
          worksUrl: result.worksUrl,
          platform: "youtube",
          publishResult: result,
        },
      };

      const res = await apiCreatePublish(publishData);
      console.log("发布记录创建成功:", res);
      return res;
    } catch (error) {
      console.error("创建发布记录失败:", error);
      // 不抛出错误，避免影响主流程
    }
  }

  // 视频发布
  async publishVideo(): Promise<IPublishResult> {
    console.log("视频发布");
    console.log(this.videoPubParams);
    console.log(this.thisPlat.account);

    try {

      const formData = new FormData();
      formData.append("file", this.videoPubParams.video.file);
      formData.append("accountId", this.thisPlat.account.id);
      formData.append("title", this.videoPubParams.title || "开心快乐每一天");
      formData.append("description", this.videoPubParams.describe || "开心快乐每一天");
      formData.append("privacyStatus", "private");
      // if (selectedSection) {
      //   formData.append("sectionId", selectedSection);
      // }

      const response = await uploadYouTubeVideoSmallApi(formData);
      console.log('response',response)
      return {
        worksId: "",
        worksUrl: "",
        success: true,
      };

      // 4. 提交稿件
      const archiveData = {
        accountId: this.thisPlat.account.id,
        uploadToken,
        title: this.videoPubParams.title || "开心快乐每一天",
        cover: coverUrl,
        tid: 21, // 默认使用日常分区
        // noReprint: this.videoPubParams.noReprint || 0,
        noReprint: 0,
        desc: this.videoPubParams.describe || "开心快乐每一天",
        tag: this.videoPubParams.topics || [],
        copyright: 1,
      };

      this.onProgress?.(0.95, "正在提交稿件");
      const submitRes: any = await apiSubmitBilibiliArchive(archiveData);
      console.log("稿件提交结果:", submitRes);

      if (submitRes?.code !== 0) {
        throw new Error("稿件提交失败");
      }

      this.onProgress?.(1, "发布成功");

      const result = {
        worksId: submitRes.data?.data || "",
        worksUrl: `https://www.bilibili.com/video/${submitRes.data?.data}`,
        success: true,
      };

      // 5. 创建发布记录
      await this.createPublishRecord(result, coverUrl);

      return result;
    } catch (error: any) {
      console.error("发布视频失败:", error);
      this.onProgress?.(0, "发布失败");

      const result = {
        worksId: "",
        worksUrl: "",
        success: false,
        failMsg: error instanceof Error ? error.message : "发布失败",
      };

      // 即使发布失败也创建记录
      await this.createPublishRecord(result, "");

      return result;
    }
  }

  // 发起上传
  private async _startUploadVideo() {
    const res = await this.thisPlat.request({
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
