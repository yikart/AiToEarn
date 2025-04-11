import * as fs from 'fs';
import sharp from 'sharp';
import * as path from 'path';
import requestNet from '../requestNet';

/**
 * 获取文件内容
 * @param filePath 本地文件路径
 */
export async function getFileContent(filePath: string): Promise<Buffer> {
  try {
    if (filePath.includes('https://') || filePath.includes('http://')) {
      const res = await requestNet({
        url: filePath,
        isReqFile: true,
      });
      return res.data;
    } else {
      // 确保路径是绝对路径
      const absolutePath = path.resolve(filePath);
      console.log('Reading file:', absolutePath);

      // 读取文件内容
      return await fs.promises.readFile(absolutePath);
    }
  } catch (error) {
    console.error('Failed to read file:', error);
    throw new Error(`读取文件失败: filePath`);
  }
}

/**
 * 获取图片的基本信息
 * @param filePath
 */
export async function getImageBaseInfo(filePath: string) {
  const buffer = await getFileContent(filePath);
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width,
    height: metadata.height,
  };
}

export const CookieToString = (cookies: Electron.Cookie[]) => {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
};
