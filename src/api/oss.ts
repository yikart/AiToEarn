import { request } from "@/utils/request";

// 获取 AWS S3 presigned post 数据
const getPresignedPostData = async (fileName: string, fileSize: number, contentType: string) => {
  const res: any = await request({
    url: "file/uploadUrl",
    method: "GET",
    params: {
      key: fileName,
      contentType: contentType,
      fileSize: fileSize
    },
  });
  
  if (res.code !== 0) {
    throw new Error("获取上传URL失败");
  }
  
  return res.data;
};

// 上传文件到OSS (前端直传 AWS S3)
export const uploadToOss = async (file: File | Blob, onProgress?: (prog: number) => void) => {
  try {
    console.log("uploadToOss", file.size);
    
    // 获取文件信息
    const fileName = (file as any).name || `file_${Date.now()}`;
    const fileSize = file.size;
    const contentType = file.type || "application/octet-stream";
    
    // 获取 presigned post 数据
    const presignedData = await getPresignedPostData(fileName, fileSize, contentType);
    console.log("Presigned data:", presignedData);
    
    // 创建 FormData 用于直传 (按照 AWS S3 presigned post 要求)
    const formData = new FormData();
    
    // 按照官方示例的顺序添加字段
    // 1. 首先添加 key (文件名)
    if (presignedData.fields.key) {
      formData.append("key", presignedData.fields.key);
    }
    
    // 2. 添加其他隐藏字段 (按字母顺序)
    const fieldKeys = Object.keys(presignedData.fields).filter(key => key !== 'key');
    fieldKeys.sort().forEach(key => {
      formData.append(key, presignedData.fields[key]);
    });
    
    // 3. 添加 Content-Type (如果存在)
    // if (contentType && !presignedData.fields['Content-Type']) {
    //   formData.append("Content-Type", contentType);
    // }
    
    // 4. 最后添加文件 (必须是最后一个字段)
    formData.append("file", file);
    
    // 调试：打印 FormData 内容
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    // 直传文件到 AWS S3 (支持进度回调)
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
        
        // 监听上传完成
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(presignedData.fields.key);
          } else {
            reject(new Error(`上传失败: ${xhr.statusText}`));
          }
        });
        
        // 监听上传错误
        xhr.addEventListener('error', () => {
          reject(new Error('上传失败: 网络错误'));
        });
        
        // 开始上传
        xhr.open('POST', presignedData.url);
        xhr.send(formData);
      });
    } else {
      // 不使用进度回调的简单版本
      const uploadResponse = await fetch(presignedData.url, {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.statusText}`);
      }
      
      return presignedData.fields.key;
    }
  } catch (error) {
    console.error("上传文件失败:", error);
    throw error;
  }
};

