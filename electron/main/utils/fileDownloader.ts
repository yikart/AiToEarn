/**
 * 文件下载工具
 * 在Electron主进程中实现文件下载功能
 */
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * 从网络URL下载文件到本地临时目录
 * @param url 文件URL
 * @param fileType 文件类型 'video' | 'image'
 * @returns 本地文件路径
 */
export const downloadFileToTemp = async (url: string, fileType: 'video' | 'image'): Promise<string> => {
  try {
    // 获取应用数据目录
    const userDataPath = app.getPath('userData');
    const tempDir = path.join(userDataPath, 'temp');
    
    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 生成唯一文件名
    const fileExtension = fileType === 'video' ? '.mp4' : '.jpg';
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(tempDir, fileName);
    
    // 下载文件
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 60000, // 60秒超时
    });
    
    // 创建写入流
    const writer = fs.createWriteStream(filePath);
    
    // 将响应数据写入文件
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`文件已下载到: ${filePath}`);
        resolve(filePath);
      });
      
      writer.on('error', (err) => {
        console.error('文件写入失败:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
}; 