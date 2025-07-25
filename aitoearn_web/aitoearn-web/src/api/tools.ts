/*
 * @Author: nevin
 * @Date: 2025-02-22 12:02:55
 * @LastEditTime: 2025-03-02 22:21:01
 * @LastEditors: nevin
 * @Description: 工具
 */
import http, { request } from "@/utils/request";
import { AiCreateType } from "./types/tools";
import axios from "axios";

export const toolsApi = {
  /**
   * 获取智能标题
   * @param url
   * @param type 1=标题 2=描述
   * @param max
   */
  async apiVideoAiTitle(url: string, type: AiCreateType, max: number) {
    const res = await http.post<string>("/tools/ai/video/title", {
      url,
      type,
      max: max - 10,
    });
    return res!.data;
  },

  /**
   * 智能图文
   */
  async apiReviewImgAi(data: {
    imgUrl: string;
    title?: string;
    desc?: string;
    max?: number;
  }) {
    const res = await http.post<string>("/tools/ai/reviewImg", data);
    return res!.data;
  },

  /**
   * 智能评论
   */
  async apiReviewAi(data: { title: string; desc?: string; max?: number }) {
    const res = await http.post<string>("/tools/ai/review", data);
    return res!.data;
  },

  /**
   * 智能评论回复
   */
  async apiReviewAiRecover(data: {
    content: string;
    title?: string;
    desc?: string;
    max?: number;
  }) {
    const res = await http.post<string>("/tools/ai/recover/review", data);
    return res!.data;
  },

  /**
   * 生成AI的html图文 弃用: 时间太长得走sse
   */
  async aiArticleHtml(content: string) {
    const res = await http.post<string>("/tools/ai/article/html", {
      content,
    });
    return res!.data;
  },

  // TODO: sse生成AI的html图文
  // /tools/ai/article/html/sse

  /**
   * 上传文件
   */
  async uploadFile(file: Blob) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await request<{ name: string }>({
      url: "/oss/upload/permanent",
      data: formData,
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res!.data;
  },

  /**
   * 上传文件临时
   */
  async uploadFileTemp(
    file: Blob,
    onProgress?: (prog: number) => void,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios({
      url: `${process.env.NEXT_PUBLIC_API_URL_PROXY}/oss/upload`,
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const prog = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total!,
        );
        if (onProgress) onProgress(prog);
      },
    });
    return res.data.data.name;
  },

  /**
   * 文本内容安全
   */
  async textModeration(content: string) {
    const res = await http.post<string>("/tools/common/text/moderation", {
      content,
    });
    return res!.data;
  },
};
