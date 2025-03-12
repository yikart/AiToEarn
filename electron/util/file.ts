import fs from 'fs';
import mimeTypes from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';
import { ffprobePath } from './ffprobe_static';
import path from 'path';
import { net } from 'electron';

// 文件工具类
// 设置 ffprobe 路径
console.log('ffprobe 路径:', ffprobePath);
ffmpeg.setFfprobePath(ffprobePath);

export interface FileInfo {
  streams: Array<{
    codec_type: string;
    width?: number;
    height?: number;
    duration?: number;
    bit_rate?: string;
    color_primaries?: string;
    r_frame_rate?: string;
    codec_name?: string;
    codec_long_name?: string;
    sample_rate?: string;
    channels?: number;
  }>;
  format: {
    size: number;
  };
  mimeType: string;
}

export interface FilePartInfo {
  fileSize: number;
  blockInfo: number[];
}

export class FileUtils {
  /**
   * 判断目录是否存在,若不存在则创建目录
   * @param catalogue
   * @returns {Promise<boolean>}
   */
  static async checkDirectories(catalogue: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.access(catalogue, fs.constants.F_OK, (err) => {
        if (err) {
          // 创建目录
          fs.mkdir(catalogue, { recursive: true }, (err) => {
            if (err) {
              reject(false);
            } else {
              resolve(true);
            }
          });
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * 获取文件信息
   * @param filePath
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    return new Promise((resolve, reject) => {
      try {
        console.log('开始获取文件信息, 文件路径:', filePath);

        // 规范化文件路径
        const normalizedPath = path.normalize(filePath);
        console.log('规范化后的文件路径:', normalizedPath);

        // 获取文件的绝对路径
        const absolutePath = path.resolve(normalizedPath);
        console.log('绝对文件路径:', absolutePath);

        // 检查文件是否存在
        if (!fs.existsSync(absolutePath)) {
          console.error('文件不存在:', absolutePath);
          reject('获取文件信息失败,失败原因:文件不存在');
          return;
        }

        // 检查文件是否可读
        try {
          fs.accessSync(absolutePath, fs.constants.R_OK);
        } catch (err) {
          console.error('文件不可读:', err);
          reject('获取文件信息失败,失败原因:文件不可读');
          return;
        }

        // 获取文件状态
        const stats = fs.statSync(absolutePath);
        if (!stats.isFile()) {
          console.error('路径不是文件:', absolutePath);
          reject('获取文件信息失败,失败原因:路径不是文件');
          return;
        }

        // 获取文件MimeType
        const fileMimeType = mimeTypes.lookup(absolutePath);
        console.log('文件 MimeType:', fileMimeType);

        if (
          !fileMimeType ||
          typeof fileMimeType !== 'string' ||
          !fileMimeType.includes('video')
        ) {
          console.error('不支持的文件格式:', fileMimeType);
          reject('获取文件信息失败,失败原因:不支持的文件格式');
          return;
        }

        // 获取视频文件信息
        console.log(`开始获取视频文件信息... [${new Date().toLocaleString()}]`);
        console.log('要分析的文件路径:', absolutePath);

        // 直接使用 ffmpeg.ffprobe 静态方法
        ffmpeg.ffprobe(absolutePath, (err: Error | null, metadata: any) => {
          if (err) {
            console.error(
              `ffprobe 错误 [${new Date().toLocaleString()}]:`,
              err,
            );
            reject('获取文件信息失败,失败原因:' + (err.message ?? '未知'));
            return;
          }
          console.log(
            `获取到的视频元数据 [${new Date().toLocaleString()}]:`,
            metadata,
          );
          const result: FileInfo = {
            ...metadata,
            mimeType: fileMimeType,
          };
          resolve(result);
        });
      } catch (err: any) {
        console.error('获取文件信息时发生错误:', err);
        reject('获取文件信息失败,失败原因:' + (err.message || '未知错误'));
      }
    });
  }

  /**
   * 获取文件大小及分片信息
   * @param filePath
   * @param blockSize
   * @returns {Promise<FilePartInfo>}
   */
  static async getFilePartInfo(
    filePath: string,
    blockSize: number,
  ): Promise<FilePartInfo> {
    return new Promise((resolve, reject) => {
      try {
        console.log(
          '开始获取文件分片信息, 文件路径:',
          filePath,
          '块大小:',
          blockSize,
        );
        const fileInfo = fs.statSync(filePath);
        const fileSize = fileInfo.size;
        console.log('文件大小:', fileSize);

        const blockInfo: number[] = [];
        for (let i = 1; i <= Math.ceil(fileSize / blockSize); i++) {
          if (i === Math.ceil(fileSize / blockSize)) {
            blockInfo.push(fileSize);
          } else {
            blockInfo.push(blockSize * i);
          }
        }
        console.log('分片信息:', blockInfo);
        resolve({
          fileSize,
          blockInfo,
        });
      } catch (err: any) {
        console.error('获取分片信息错误:', err);
        reject('获取分片信息失败,失败原因:' + err.message);
      }
    });
  }

  /**
   * 获取文件分片内容
   * @param filePath
   * @param start
   * @param end
   */
  static async getFilePartContent(
    filePath: string,
    start: number,
    end: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const readStream = fs.createReadStream(filePath, {
          start: start,
          end: end,
        });
        const chunks: Buffer[] = [];
        // @ts-ignore
        readStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        readStream.on('end', () => {
          readStream.close();
          resolve(Buffer.concat(chunks));
        });
      } catch (err: any) {
        reject('获取文件分片内容失败,失败原因:' + err.message);
      }
    });
  }

  /**
   * 获取项目根目录
   */
  static getAppRootDir(): string {
    // 在开发环境中
    if (process.env.NODE_ENV === 'development') {
      return path.join(process.cwd(), 'node_modules', 'ffprobe-static', 'bin');
    }
    // 在生产环境中
    if (process.type === 'renderer') {
      return path.join(process.resourcesPath, 'app.asar');
    }
    return path.join(process.resourcesPath, 'app.asar.unpacked');
  }

  /**
   * 获取文件数据目录
   * @returns
   */
  static getAppDataPath() {
    switch (process.platform) {
      case 'darwin': {
        return path.join(
          process.env.HOME || '',
          'Library',
          'Application Support',
          'att',
        );
      }
      case 'win32': {
        return path.join(process.env.APPDATA || '', 'att');
      }
      case 'linux': {
        return path.join(process.env.HOME || '', 'att');
      }
      default: {
        console.log('Unsupported platform!');
        process.exit(1);
      }
    }
  }

  /**
   * 下载文件
   * @param url
   * @param name
   * @returns
   */
  static async downFile(url: string, name?: string): Promise<string> {
    const dirPath = this.getAppDataPath();
    console.log('------- dirPath', dirPath);

    await this.checkDirectories(dirPath);

    return new Promise((resolve, reject) => {
      const request = net.request(url);
      let fileStream: NodeJS.WritableStream | null = null;
      let filePath: string;

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error(`下载失败: 状态码 ${response.statusCode}`));
        }

        filePath = path.join(dirPath, name || 'default_filename.mp4');
        fileStream = fs.createWriteStream(filePath);

        response.on('end', () => {
          if (fileStream) {
            fileStream.end();
            resolve(filePath); // 确保filePath已定义
          }
        });
      });

      request.on('error', (err) => {
        reject(err);
      });

      // 必须调用request.end()来发送请求
      request.end();
    });
  }
}
