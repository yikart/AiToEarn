import os from 'os';
import path from 'path';
import fs from 'fs';

const platform = os.platform();
const arch = os.arch();

// 检查平台支持
if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
  console.error('ffprobe unsupported platform.');
  // process.exit(1);
}

// 检查 macOS 架构支持
if (platform === 'darwin' && arch !== 'x64' && arch !== 'arm64') {
  console.error('ffprobe unsupported architecture.');
  // process.exit(1);
}

// 获取应用程序的根目录
const getAppRootDir = (): string => {
  // 在开发环境中
  if (process.env.NODE_ENV === 'development') {
    return path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin');
  }
  // 在生产环境中
  if (process.type === 'renderer') {
    return path.join(process.resourcesPath, 'app.asar');
  }
  return path.join(process.resourcesPath, 'app.asar.unpacked');
};

// 构建 ffprobe 路径
let ffprobePath: string;

if (platform === 'win32') {
  ffprobePath = path.join(getAppRootDir(), 'win32', 'x64', 'ffprobe.exe');
} else if (platform === 'darwin') {
  ffprobePath = path.join(
    getAppRootDir(),
    'darwin',
    arch === 'arm64' ? 'arm64' : 'x64',
    'ffprobe',
  );
} else {
  ffprobePath = path.join(
    getAppRootDir(),
    'linux',
    arch === 'arm64' ? 'arm64' : 'x64',
    'ffprobe',
  );
}

console.log('FFprobe 路径:', ffprobePath);

// 检查文件是否存在
try {
  if (!fs.existsSync(ffprobePath)) {
    // TODO: 打包之后会直接走这个逻辑，直接退出
    console.log('FFprobe 可执行文件不存在:', ffprobePath);
    // process.exit(1);
  }
} catch (err) {
  console.log('检查 FFprobe 文件时出错:', err);
  // process.exit(1);
}

export { ffprobePath };
