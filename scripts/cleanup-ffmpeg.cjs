/*
 * @Author: nevin
 * @Date: 2025-02-23 17:22:25
 * @LastEditTime: 2025-02-23 20:16:13
 * @LastEditors: nevin
 * @Description: ff 组件复制脚本
 */
const fs = require('fs');
const path = require('path');
const { platform, arch } = process; // 获取当前构建平台
// 获取当前的CPU架构

function getFFmpegPath() {
  const res = {
    ffmpegPath: '',
    ffprobePath: '',
  };

  res.ffmpegPath = path.join(
    __dirname,
    './file',
    `ff/${platform}/${arch}/ffmpeg`,
  );
  res.ffprobePath = path.join(
    __dirname,
    './file',
    `ff/${platform}/${arch}/ffprobe`,
  );

  return res;
}

exports.default = async function (context) {
  const binPath = path.join(__dirname, '../public/bin');

  const pathInfo = getFFmpegPath();

  const fileNameEnd = platform === 'win32' ? '.exe' : '';

  // 复制ffmpeg
  fs.copyFileSync(
    pathInfo.ffmpegPath + fileNameEnd,
    path.join(binPath, `ffmpeg${fileNameEnd}`),
  );

  fs.copyFileSync(
    pathInfo.ffprobePath + fileNameEnd,
    path.join(binPath, `ffprobe${fileNameEnd}`),
  );
};
