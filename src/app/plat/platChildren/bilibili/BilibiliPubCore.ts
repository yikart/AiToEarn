import { BilibiliPlat } from "@/app/plat/platChildren/bilibili/BilibiliPlat";
import {
  IPublishResult,
  IVideoPublishItem,
  PubProgressType,
} from "@/app/plat/plat.type";
import { calculateChunks } from "@/app/plat/plat.util";
import {
  apiInitBilibiliVideo,
  apiUploadBilibiliCover,
  apiSubmitBilibiliArchive,
  apiUploadBilibiliVideoPart,
  apiCompleteBilibiliVideo,
} from "@/api/bilibili";
import { apiCreatePublish, AccountType, PubStatus } from "@/api/publish";
import { PubType } from "@/app/config/publishConfig";

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

  // 创建发布记录
  private async createPublishRecord(result: any, coverUrl: string) {
    try {
      const publishData = {
        flowId: `bilibili_${Date.now()}`, // 生成唯一的流程ID
        type: PubType.VIDEO,
        title: this.videoPubParams.title || "",
        desc: this.videoPubParams.describe || "",
        accountId: this.kwaiPlat.account.id,
        uid: this.kwaiPlat.account.uid || "",
        accountType: AccountType.BILIBILI,
        videoUrl: result.worksUrl, // 使用构建的视频地址
        coverUrl: coverUrl, // 使用实际上传的封面地址
        imgList: [],
        publishTime: new Date().toISOString(),
        status: result.success ? PubStatus.RELEASED : PubStatus.FAIL,
        option: {
          worksId: result.worksId,
          worksUrl: result.worksUrl,
          platform: "bilibili",
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
    console.log(this.kwaiPlat.account);

    try {
      // 1. 获取上传token
      const initRes = await apiInitBilibiliVideo({
        accountId: this.kwaiPlat.account.id,
        name: this.videoPubParams.video.filename,
      });

      if (!initRes?.data?.data) {
        throw new Error("获取上传token失败");
      }

      const uploadToken = initRes.data.data;
      console.log("获取上传token成功:", uploadToken);
      this.onProgress?.(0.1, "获取上传token成功");

      // 2. 上传视频（分片上传）
      if (!this.videoPubParams.video.file) {
        throw new Error("视频文件不存在");
      }

      const file = this.videoPubParams.video.file;
      const chunkRange = calculateChunks(file.size, this.fileBlockSize);
      console.log(`文件将被分为 ${chunkRange.length} 个分片`);

      // 分片上传
      for (let i = 0; i < chunkRange.length; i++) {
        const range = chunkRange[i];
        const sliced = file.slice(range.start, range.end);
        console.log(`上传分片 ${i + 1}/${chunkRange.length}`);

        const res = await apiUploadBilibiliVideoPart(
          this.kwaiPlat.account.id,
          uploadToken,
          i + 1,
          sliced,
        );

        if (res?.code !== 0) {
          throw new Error(`分片 ${i + 1} 上传失败`);
        }

        // 更新进度
        const progress = 0.1 + (0.6 * (i + 1)) / chunkRange.length;
        this.onProgress?.(progress, `上传分片 ${i + 1}/${chunkRange.length}`);
      }

      // 合并分片
      console.log("开始合并分片...");
      this.onProgress?.(0.7, "开始合并分片");
      const completeRes = await apiCompleteBilibiliVideo(
        this.kwaiPlat.account.id,
        uploadToken,
      );
      if (completeRes?.code !== 0) {
        throw new Error("分片合并失败");
      }
      this.onProgress?.(0.8, "分片合并完成");

      // 3. 上传封面
      let coverUrl: any = "";
      if (this.videoPubParams.cover?.file) {
        const formData = new FormData();
        formData.append("file", this.videoPubParams.cover.file);
        const coverRes = await apiUploadBilibiliCover(
          this.kwaiPlat.account.id,
          formData,
        );
        if (coverRes?.data) {
          coverUrl = coverRes.data;
          console.log("封面上传成功:", coverUrl);
          this.onProgress?.(0.9, "封面上传成功");
        }
      }

      // 4. 提交稿件
      const archiveData = {
        accountId: this.kwaiPlat.account.id,
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
