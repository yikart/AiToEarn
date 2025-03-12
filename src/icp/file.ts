/**
 * 文件操作IPC接口
 */
import { message } from 'antd';
import axios from 'axios';

/**
 * 从网络URL下载文件到本地临时目录
 * @param url 文件URL
 * @param fileType 文件类型 'video' | 'image'
 * @returns 本地文件路径或URL
 */
export const icpDownloadFileToTemp = async (url: string, fileType: 'video' | 'image'): Promise<string> => {
  try {
    // 检查是否支持IPC
    if (window.electron?.ipcRenderer) {
      // 使用Electron IPC
      const result = await window.electron.ipcRenderer.invoke('download-file-to-temp', url, fileType);
      
      if (!result.success) {
        throw new Error(result.error || '下载失败');
      }
      
      return result.filePath;
    } else {
      // 浏览器环境下，直接返回URL
      // 验证URL是否可访问
      try {
        const response = await axios.head(url);
        if (response.status === 200) {
          console.log('URL可访问，直接使用原始URL');
          return url;
        }
      } catch (error) {
        console.warn('URL访问检查失败，继续使用原始URL', error);
      }
      
      return url;
    }
  } catch (error) {
    console.error('文件下载失败:', error);
    message.error('文件下载失败，使用原始URL继续');
    // 出错时返回原始URL
    return url;
  }
}; 