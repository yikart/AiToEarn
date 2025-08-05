/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-03-31 12:26:51
 * @LastEditors: nevin
 * @Description:
 */
import { FileUtils } from '../../util/file';
import { FFmpegVideoUtil } from '../../util/ffmpeg/video';
import { Controller, Icp, Inject, Scheduled } from '../core/decorators';
import { ToolsService } from './service';
import { clearOldLogs } from '../../global/log';
import { toolsApi } from '../api/tools';

@Controller()
export class ToolsController {
  @Inject(ToolsService)
  private readonly toolsService!: ToolsService;

  /**
   * 视频截取指定时间点的帧
   */
  @Icp('ICP_GET_VIDEO_COVER')
  async getVideoCover(
    event: Electron.IpcMainInvokeEvent,
    path: string,
    time?: string, // 添加可选参数 time
  ): Promise<string> {
    return await FFmpegVideoUtil.getVideoCover(path, time);
  }

  /**
   * 下载文件
   */
  @Icp('ICP_TOOL_DOWN_FILE')
  async downFile(
    event: Electron.IpcMainInvokeEvent,
    url: string,
    name?: string,
  ): Promise<string> {
    try {
      const res = await FileUtils.downFile(url, name);
      return res;
    } catch (error) {
      console.log('--- ICP_TOOL_DOWN_FILE error ---', error);
      return '';
    }
  }

  /**
   * 下载文件
   */
  @Icp('ICP_TOOL_UP_FILE')
  async upFile(
    event: Electron.IpcMainInvokeEvent,
    path: string,
    secondPath?: string,
  ): Promise<string> {
    try {
      const res = await toolsApi.upFile(path, secondPath);
      console.log('----- ICP_TOOL_UP_FILE ---', res);

      return res;
    } catch (error) {
      console.log('--- ICP_TOOL_UP_FILE error ---', error);
      return '';
    }
  }

  // 定时清理日志, 每小时进行
  @Scheduled('0 0 * * * *', 'clearLog')
  async clearLog() {
    console.log('clear Log ing ...');
    clearOldLogs();
  }

  /**
   * AI生成评论
   */
  @Icp('ai-generate-comment')
  async aiGenerateComment(
    event: Electron.IpcMainInvokeEvent,
    data: { subject: string; prompt: string; max?: number },
  ): Promise<string> {
    try {
      const result = await toolsApi.aiGenerateComment(data);
      return result;
    } catch (error) {
      console.log('--- ai-generate-comment error ---', error);
      return '';
    }
  }

  /**
   * AI回复评论
   */
  @Icp('ai-recover-review')
  async aiRecoverReview(
    event: Electron.IpcMainInvokeEvent,
    data: { content: string; title?: string; desc?: string; max?: number },
  ): Promise<string> {
    try {
      const result = await toolsApi.aiRecoverReview(data);
      return result;
    } catch (error) {
      console.log('--- ai-recover-review error ---', error);
      return '';
    }
  }
