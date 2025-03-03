/*
 * @Author: nevin
 * @Date: 2025-01-17 21:26:26
 * @LastEditTime: 2025-02-11 21:41:20
 * @LastEditors: nevin
 * @Description: 浏览器视图
 */
import { dialog, ipcMain } from 'electron';
import fs from 'fs';
import { FileUtils } from '../util/file';
import path from 'path';
import requestNet from '../plat/requestNet';
// @ts-ignore
import coordtransform from 'coordtransform';

export interface ISaveFileParams {
  // 要保存的路由
  saveDir: string;
  // 文件名
  filename: string;
  // 文件
  file: Uint8Array;
}

export function views(win: Electron.BrowserWindow) {
  // 获取经纬度
  ipcMain.handle('GET_LOCATION', async () => {
    const res = await requestNet({
      url: `https://map.baidu.com/?qt=ipLocation&t=${Date.now()}`,
      headers: {
        cookie:
          'BAIDUID=C6DFA184EA0E181B507D36D4E39DE552:FG=1; BAIDUID_BFESS=C6DFA184EA0E181BFB22AB6E4BC30249:FG=1',
      },
      method: 'GET',
    });
    console.log(res);
    const { lat, lng } = res.data.rgc.result.location;
    const gcj02 = coordtransform.bd09togcj02(lng, lat);
    return {
      bd09: [lng, lat],
      wgs84: coordtransform.gcj02towgs84(gcj02[0], gcj02[1]),
      gcj02,
    };
  });

  // 打开开发者工具
  ipcMain.handle('OPEN_DEV_TOOLS', () => {
    win.webContents.openDevTools({ mode: 'right' });
  });

  // 保存文件
  ipcMain.handle(
    'ICP_VIEWS_SAVE_FILE',
    (event, { saveDir, filename, file }: ISaveFileParams) => {
      return new Promise(async (resolve) => {
        const outputDir = path.join(
          FileUtils.getAppDataPath(),
          'resource/images/cropper',
        );
        await FileUtils.checkDirectories(outputDir + saveDir);
        const filePath = outputDir + saveDir + '/' + filename;

        fs.writeFile(filePath, file, (err) => {
          if (err) {
            console.error('保存错误', err);
          } else {
            console.log('文件保存成功：', filePath);
            resolve(filePath);
          }
        });
      });
    },
  );

  // 根据路径获取文件流
  ipcMain.handle('ICP_VIEWS_GET_FILE_STREAM', async (event, path: string) => {
    return fs.readFileSync(path);
  });

  /**
   * 选择视频文件
   * @param isMultiSelections 是否允许多选
   */
  ipcMain.handle('ICP_VIEWS_CHOSE_VIDEO', async (event, isMultiSelections) => {
    const properties = ['openFile'];
    if (isMultiSelections) properties.push('multiSelections');

    try {
      const result = await dialog.showOpenDialog({
        properties: properties as Array<'openFile'>,
        filters: [{ name: 'mp4视频文件', extensions: ['mp4', 'mov'] }],
      });

      if (result.canceled) return null;
      return result.filePaths.map((v) => {
        return {
          path: v,
          video: fs.readFileSync(v),
        };
      });
    } catch (error) {
      console.error('Error selecting video:', error);
      return null;
    }
  });

  /**
   * 选择图片文件
   * @param isMultiSelections 是否允许多选
   */
  ipcMain.handle('ICP_VIEWS_CHOSE_IMG', async (event, isMultiSelections) => {
    const properties = ['openFile'];
    if (isMultiSelections) properties.push('multiSelections');

    try {
      // 打开文件选择对话框
      const result = await dialog.showOpenDialog({
        properties: properties as Array<'openFile'>,
        filters: [{ name: '图片文件', extensions: ['jpg', 'png', 'jpeg'] }], // 只允许图片文件
      });

      return result.filePaths.map((v) => {
        return {
          path: v,
          file: fs.readFileSync(v),
        };
      });
    } catch (error) {
      console.error('------- error --------', error);
      return '';
    }
  });
}
