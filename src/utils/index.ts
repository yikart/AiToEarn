import moment from 'moment';
/**
 * 生成唯一ID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 获取文件路径中的文件名
export function getFilePathName(path: string) {
  if (!path) return '';
  const path1 = path.split('\\')[path.split('\\').length - 1];
  return path1.split('/')[path1.split('/').length - 1];
}

// 格式化时间
export function formatTime(
  time: string | number | Date,
  format: string = 'YYYY-MM-DD HH:MM:SS',
) {
  return moment(time).format(format);
}

/**
 * 将数值转换为 hh:mm:ss 格式的字符串
 * 7 -> 00:00:07
 * @param seconds - 要转换的秒数
 * @returns 格式化后的时间字符串
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

