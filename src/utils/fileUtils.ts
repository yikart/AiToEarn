/**
 * 文件工具函数
 */
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';

/**
 * 从网络URL下载文件到本地临时目录
 * @param url 文件URL
 * @param fileType 文件类型 'video' | 'image'
 * @returns 本地文件路径或Blob URL
 */
export const downloadFileToLocal = async (url: string, fileType: 'video' | 'image'): Promise<string> => {
  try {
    // 使用代理服务器解决跨域问题
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    
    // 下载文件
    const response = await fetch(proxyUrl, {
      mode: 'cors',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }
    
    // 获取文件内容
    const blob = await response.blob();
    
    // 创建Blob URL
    const blobUrl = URL.createObjectURL(blob);
    
    return blobUrl;
  } catch (error) {
    console.error('文件下载失败:', error);
    message.error('文件下载失败，请重试');
    throw error;
  }
};

/**
 * 使用视频元素加载视频URL
 * @param videoUrl 视频URL
 * @returns Promise<string> 视频URL
 */
export const loadVideoUrl = (videoUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    // 直接返回原始URL，依赖视频元素自身的加载能力
    resolve(videoUrl);
  });
};

/**
 * 使用图片元素加载图片URL
 * @param imageUrl 图片URL
 * @returns Promise<string> 图片URL
 */
export const loadImageUrl = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    // 创建图片元素预加载
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 尝试解决跨域问题
    img.onload = () => resolve(imageUrl);
    img.onerror = () => {
      console.warn('图片加载失败，使用原始URL');
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
};

/**
 * 从网络URL下载文件并保存到本地
 * @param url 文件URL
 * @param filename 保存的文件名
 */
export const downloadAndSaveFile = async (url: string, filename: string): Promise<void> => {
  try {
    // 创建一个a标签
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank'; // 在新窗口打开，避免跨域问题
    a.style.display = 'none';
    
    // 添加到DOM并触发点击
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
    
    // 等待用户完成下载
    return new Promise((resolve) => {
      // 给用户足够的时间保存文件
      setTimeout(resolve, 3000);
    });
  } catch (error) {
    console.error('保存文件失败:', error);
    message.error('保存文件失败，请重试');
    throw error;
  }
}; 