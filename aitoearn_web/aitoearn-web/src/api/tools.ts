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
    const res = await http.post<string>("tools/ai/video/title", {
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
    const res = await http.post<string>("tools/ai/reviewImg", data);
    return res!.data;
  },

  /**
   * 智能评论
   */
  async apiReviewAi(data: { title: string; desc?: string; max?: number }) {
    const res = await http.post<string>("tools/ai/review", data);
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
    const res = await http.post<string>("tools/ai/recover/review", data);
    return res!.data;
  },

  /**
   * 生成AI的html图文 弃用: 时间太长得走sse
   */
  async aiArticleHtml(content: string) {
    const res = await http.post<string>("tools/ai/article/html", {
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
      url: "oss/upload/permanent",
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
    const fileSize = file.size;
    const fileName = (file as any).name || 'file';
    const contentType = file.type || 'application/octet-stream';
    
    // 如果文件大于10MB，使用分片上传
    if (fileSize > (10 * 1024 * 1024)) {
      return this.uploadFileTempMultipart(file, fileName, contentType, onProgress);
    }
    
    // 小于10MB，使用普通上传
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios({
      url: `${process.env.NEXT_PUBLIC_API_URL}/file/upload`,
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
    return res.data.data.key;
  },

  /**
   * 分片上传文件临时
   */
  async uploadFileTempMultipart(
    file: Blob,
    fileName: string,
    contentType: string,
    onProgress?: (prog: number) => void,
  ): Promise<string> {
    try {
      // 1. 初始化分片上传
      const initResponse = await axios({
        url: `${process.env.NEXT_PUBLIC_API_URL}/file/uploadPart/init`,
        method: "POST",
        data: {
          fileName,
          secondPath: "uploads",
          fileSize: file.size,
          contentType,
        },
      });

      if (initResponse.data.code != 0) {
        throw new Error("初始化上传失败");
      }

      const { fileId, uploadId } = initResponse.data.data;
      console.log("初始化分片上传成功:", fileId, uploadId);

      // 2. 分片上传文件
      const chunkSize = 5 * 1024 * 1024; // 5MB per chunk
      const chunks = Math.ceil(file.size / chunkSize);
      const parts = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        // 上传分片
        const formData = new FormData();
        formData.append("file", chunk);
        
        const partResponse = await axios({
          url: `${process.env.NEXT_PUBLIC_API_URL}/file/uploadPart/upload`,
          method: "POST",
          data: formData,
          params: {
            fileId,
            uploadId,
            partNumber: i + 1,
          },
        });

        if (partResponse.data.code != 0) {
          throw new Error("分片上传失败");
        }

        parts.push({
          PartNumber: partResponse.data.data.PartNumber,
          ETag: partResponse.data.data.ETag,
        });

        // 更新进度
        const currentProgress = Math.round(((i + 1) / chunks) * 100);
        if (onProgress) onProgress(currentProgress);
        console.log(`分片 ${i + 1}/${chunks} 上传完成`);
      }

             // 3. 完成分片上传
       await axios({
         url: `${process.env.NEXT_PUBLIC_API_URL}/file/uploadPart/complete`,
         method: "POST",
         data: {
           fileId,
           uploadId,
           parts,
         },
       });

       // 文件地址在初始化时就已经返回了
       return fileId;
    } catch (error) {
      console.error("分片上传失败:", error);
      throw error;
    }
  },

  /**
   * 文本内容安全
   */
  async textModeration(content: string) {
    const res = await http.post<string>("aliGreen/textGreen", {
      content,
    });
    return res;
  },
};
