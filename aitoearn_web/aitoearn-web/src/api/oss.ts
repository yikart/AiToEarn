import { request } from "@/utils/request";

// 上传文件到OSS
export const uploadToOss = async (file: File, onProgress?: (prog: number) => void) => {
  try {
    console.log("uploadToOss", file.size);
    // 如果文件大于10MB，使用分片上传
    if (file.size > (10 * 1024 * 1024)) {
      return uploadToOssMultipart(file, onProgress);
    }
    
    // 小于10MB，使用普通上传
    const formData = new FormData();
    formData.append("file", file);

    const res: any = await request({
      url: "file/upload",
      method: "POST",
      body: formData,
    });
    return res?.data.key;
  } catch (error) {
    console.error("上传文件失败:", error);
    throw error;
  }
};

// 分片上传文件到OSS
export const uploadToOssMultipart = async (file: File, onProgress?: (prog: number) => void) => {
  try {
    // 1. 初始化分片上传
    const initResponse: any = await request({
      url: "file/uploadPart/init",
      method: "POST",
      data: {
        fileName: file.name,
        secondPath: "uploads",
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
      },
    });

    if (initResponse.code != 0) {
      throw new Error("初始化上传失败");
    }

    const { fileId, uploadId } = initResponse.data;

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
      
      const partResponse: any = await request({
        url: "file/uploadPart/upload",
        method: "POST",
        data: formData,
        params: {
          fileId,
          uploadId,
          partNumber: i + 1,
        },
      });

      if (partResponse.code != 0) {
        throw new Error("分片上传失败");
      }

      parts.push({
        PartNumber: partResponse.data.PartNumber,
        ETag: partResponse.data.ETag,
      });

      // 更新进度
      const currentProgress = Math.round(((i + 1) / chunks) * 100);
      if (onProgress) onProgress(currentProgress);
    }

         // 3. 完成分片上传
     await request({
       url: "file/uploadPart/complete",
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
};
