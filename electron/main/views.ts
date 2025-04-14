/*
 * @Author: nevin
 * @Date: 2025-01-17 21:26:26
 * @LastEditTime: 2025-04-01 17:26:37
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
import { logger } from '../global/log';

export interface ISaveFileParams {
  // 要保存的路由
  saveDir: string;
  // 文件名
  filename: string;
  // 文件
  file: Uint8Array;
}

export function views(win: Electron.BrowserWindow) {
  // 窗口最小化
  ipcMain.handle('window-minimize', function () {
    win.minimize();
  });
  // 窗口最大化
  ipcMain.handle('window-maximize', function () {
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
  });
  // 关闭窗口
  ipcMain.handle('window-close', function () {
    win.close();
  });

  // 获取经纬度
  ipcMain.handle('GET_LOCATION', async () => {
    let res: any;

    for (let i = 0; i < 10; i++) {
      res = await requestNet({
        url: `https://map.baidu.com/?qt=ipLocation&t=${Date.now()}`,
        headers: {
          cookie: `BAIDUID=C6DFA184EA0E181B507D36D4E39DE552:FG=1; BAIDUID_BFESS=C6DFA184EA0E181B507D36D4E39DE552:FG=1; BAIDU_WISE_UID=wapp_1740893445646_358; ZFY=gFmlsByYQo2uV:A8KgAXQ5Ou6usNB8S4rufvkkSZ9WfE:C; arialoadData=false; RT="z=1&dm=baidu.com&si=6acd8df5-273b-4d7b-a273-72762d6a27a7&ss=m7snsitx&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&r=32ngg0aq&ul=3pfv&hd=3pg5"; PSTM=1740990133; H_PS_PSSID=61027_61680_62126_62169_62200_62278_62325_62344_62345_62328_62367_62369_62372_62246_62391; BA_HECTOR=24a02la1al052hag8g01a0a1bclj991jsaplo1v; BIDUPSID=256707C2A28F613DE9EA4FC5C7347285`,
        },
        method: 'GET',
      });
      if (res?.data?.rgc?.result) break;
    }
    const { lat, lng } = res.data.rgc.result.location;
    const gcj02 = coordtransform.bd09togcj02(lng, lat);
    return {
      bd09: [lng, lat],
      wgs84: coordtransform.gcj02towgs84(gcj02[0], gcj02[1]),
      gcj02,
      city: res.data.rgc.result.addressComponent.city,
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
        logger.info('保存文件----111', { saveDir });
        const outputDir = path.join(
          FileUtils.getAppDataPath()!,
          'resource/images/cropper',
        );
        logger.info('保存文件----222', outputDir);

        await FileUtils.checkDirectories(outputDir + saveDir);
        const filePath = outputDir + saveDir + '/' + filename;
        logger.info('保存文件----filePath', filePath);

        fs.writeFile(filePath, file, (err) => {
          if (err) {
            logger.error('保存错误', err);
            console.error('保存错误', err);
          } else {
            logger.info('文件保存成功：', filePath);
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
