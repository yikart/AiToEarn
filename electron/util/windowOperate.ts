import { BrowserWindow } from 'electron';
import { SendChannelEnum } from '../../commont/UtilsEnum';

/**
 * 关于主进程 win 的所有操作
 * 这个类会在主进程初始化调用 init 方法注入 win属性
 */
class WindowOperate {
  win?: BrowserWindow;

  init(win: BrowserWindow) {
    this.win = win;
  }
  // window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  // console.log('[Receive Main-process message]:', ...args);
  // });

  // 向渲染进程发送消息
  sendRenderMsg(channel: SendChannelEnum, ...args: any[]) {
    this.win?.webContents.send(channel, ...args);
  }
}

const windowOperate = new WindowOperate();
export default windowOperate;
