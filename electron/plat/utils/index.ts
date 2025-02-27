import * as fs from 'fs';
import * as path from 'path';

// electron cookie 转 playwright cookie
export function cookieToPlaywright(cookies: Electron.Cookie[]) {
  return cookies.map((v) => {
    return {
      name: v.name,
      value: v.value,
      domain: v.domain,
      path: v.path,
      secure: v.secure,
      httpOnly: v.httpOnly,
    };
  });
}

/**
 * 获取文件内容
 * @param filePath 本地文件路径
 */
export async function getFileContent(filePath: string): Promise<Buffer> {
  try {
    // 确保路径是绝对路径
    const absolutePath = path.resolve(filePath);
    console.log('Reading file:', absolutePath);

    // 读取文件内容
    const fileContent = await fs.promises.readFile(absolutePath);
    return fileContent;
  } catch (error) {
    console.error('Failed to read file:', error);
    throw new Error(`读取文件失败: filePath`);
  }
}

export const CookieToString = (cookies: Electron.Cookie[]) => {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
};
