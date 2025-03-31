/*
 * @Author: nevin
 * @Date: 2025-02-14 16:36:05
 * @LastEditTime: 2025-02-23 20:07:52
 * @LastEditors: nevin
 * @Description: ffmpeg工具
 */
import ffmpeg from 'fluent-ffmpeg'; // 一个封装了 ffmpeg API 的库，当然可以选择不安装，直接使用字符串拼接的方式调用
import os from 'os';
import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const platform = os.platform();
const arch = os.arch();

// 获取ffmpeg二进制文件的路径,不同平台不一样
function setFFmpegPath() {
  const ffPath = app.isPackaged
    ? path.join(process.resourcesPath, 'bin')
    : path.join(__dirname, `../../scripts/file/ff/${platform}/${arch}`);

  ffmpeg.setFfprobePath(
    path.join(ffPath, `ffprobe${platform === 'win32' ? '.exe' : ''}`),
  );
  ffmpeg.setFfmpegPath(
    path.join(ffPath, `ffmpeg${platform === 'win32' ? '.exe' : ''}`),
  );
}
setFFmpegPath();

export default class FFmpeg {
  ffmpeg: ffmpeg.FfmpegCommand;

  constructor(inputPath: string) {
    this.ffmpeg = ffmpeg(inputPath);
  }
}
