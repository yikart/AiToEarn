/**
 * 文件处理IPC
 */
import { ipcMain } from 'electron';
import { downloadFileToTemp } from '../utils/fileDownloader';

// 注册IPC处理程序
export function registerFileHandlers() {
  // 下载文件到临时目录
  ipcMain.handle('download-file-to-temp', async (_, url: string, fileType: 'video' | 'image') => {
    try {
      const filePath = await downloadFileToTemp(url, fileType);
      return { success: true, filePath };
    } catch (error) {
      console.error('下载文件失败:', error);
      return { success: false, error: error.message };
    }
  });
} 