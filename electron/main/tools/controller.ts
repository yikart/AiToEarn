/*
 * @Author: nevin
 * @Date: 2025-01-20 22:02:54
 * @LastEditTime: 2025-02-14 22:20:12
 * @LastEditors: nevin
 * @Description:
 */
import { FileUtils } from '../../util/file';
import { FFmpegVideoUtil } from '../../util/ffmpeg/video';
import { Controller, Icp, Inject } from '../core/decorators';
import { ToolsService } from './service';

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
   * 视频截取指定时间点的帧
   */
  @Icp('ICP_TOOL_DOWN_FILE')
  async downFile(
    event: Electron.IpcMainInvokeEvent,
    url: string,
    name?: string,
  ): Promise<string> {
    const res = await FileUtils.downFile(url, name);
    console.log('-----', res);
    return '';
  }
}
