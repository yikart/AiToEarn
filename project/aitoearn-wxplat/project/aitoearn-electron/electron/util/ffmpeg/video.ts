/*
 * @Author: nevin
 * @Date: 2025-02-14 18:23:16
 * @LastEditTime: 2025-03-24 20:55:11
 * @LastEditors: nevin
 * @Description:
 */
import { ScreenshotsConfig } from 'fluent-ffmpeg';
import FFmpeg from './index';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FileUtils } from '../file';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class FFmpegVideoUtil {
  /**
   * 获取视频封面
   * @param videoFilePath 视频文件路径
   * @param time 可选参数，指定要截取的时间点（格式为 '00:00:01'）
   * @returns
   */
  static async getVideoCover(videoFilePath: string, time?: string) {
    return new Promise<string>((resolve, reject) => {
      try {
        const ffmpeg = new FFmpeg(videoFilePath);
        console.log('------ outputDir', FileUtils.getAppDataPath());

        const outputDir = path.join(FileUtils.getAppDataPath()!, 'screenshots');

        const option: ScreenshotsConfig = {
          count: 1,
          folder: outputDir,
          filename: 'thumbnail.png',
        };

        if (time) option.timemarks = [time];
        ffmpeg.ffmpeg.takeScreenshots(option);

        ffmpeg.ffmpeg.on('end', () => {
          console.log('截取成功');
          resolve(
            outputDir.replace(/\\/g, '/') +
              '/thumbnail.png'.replace(/\\/g, '/'),
          );
        });

        ffmpeg.ffmpeg.on('error', (err) => {
          console.log('---- getVideoCover on error---- 截取失败', err);
          resolve('');
        });
      } catch (error) {
        console.log('---- getVideoCover --- 截取失败', error);
        resolve('');
      }
    });
  }
}
