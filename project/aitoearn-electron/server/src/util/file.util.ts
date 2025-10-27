import path from 'node:path';
import * as fs from 'node:fs';

enum Type {
  IMAGE = '图片',
  TXT = '文档',
  MUSIC = '音乐',
  VIDEO = '视频',
  OTHER = '其他',
}

export function getFileType(extName: string) {
  const documents = 'txt doc pdf ppt pps xlsx xls docx';
  const music = 'mp3 wav wma mpa ram ra aac aif m4a';
  const video = 'avi mpg mpe mpeg asf wmv mov qt rm mp4 flv m4v webm ogv ogg';
  const image =
    'bmp dib pcp dif wmf gif jpg tif eps psd cdr iff tga pcd mpt png jpeg';
  if (image.includes(extName)) return Type.IMAGE;

  if (documents.includes(extName)) return Type.TXT;

  if (music.includes(extName)) return Type.MUSIC;

  if (video.includes(extName)) return Type.VIDEO;

  return Type.OTHER;
}

export function getName(fileName: string) {
  if (fileName.includes('.')) return fileName.split('.')[0];

  return fileName;
}

export function getExtname(fileName: string) {
  return path.extname(fileName).replace('.', '');
}

export function getSize(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

/**
 * nodejs存储文件到本地
 * @param base64String
 * @param path
 * @param fileName
 * @returns
 */
export function saveFile(base64String: string, path: string, fileName: string) {
  // 文件不存在则创建文件
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(path + fileName, base64String, 'base64', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}
