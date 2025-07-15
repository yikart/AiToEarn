import http from "@/utils/request"; 
import { request } from '@/utils/request';


// 上传文件到OSS
export const uploadToOss = async (file: File) => {
  try {

    // 2. 上传文件到OSS
    const formData = new FormData();
    formData.append('file', file);
    
    let res:any = await request({
      url: '/oss/upload',
      method: 'POST',
      body: formData,
    });
    return res?.data.name;

  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
}; 