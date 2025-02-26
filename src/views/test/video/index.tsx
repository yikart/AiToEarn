/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-21 21:18:45
 * @LastEditors: nevin
 * @Description: 视频测试
 */
import VideoChoose from '@/components/Choose/VideoChoose';
import { ipcGetVideoCover } from '@/icp/tools';
import Update from '@/components/update';
import { Button } from 'antd';

export default function Page() {
  async function onChoose(e: any) {
    console.log('---- ', e.videoPath);

    const res = await ipcGetVideoCover(e.videoPath);

    console.log('---- ', res);
  }

  async function setChromPath() {
    const res: string = await window.ipcRenderer.invoke(
      'ICP_SET_CHROMIUM_PATH',
    );
    console.log('---- ', res, '----');
  }

  async function getChromPath() {
    const res = await window.ipcRenderer.invoke('ICP_APP_GET_INFO');
    console.log('---- ', res, '----');
  }

  return (
    <div>
      <h1>视频测试</h1>
      <VideoChoose onChoose={onChoose} />
      1111
      <Update />
      <Button onClick={getChromPath}>获取 Chromium 路径</Button>
      <Button onClick={setChromPath}>设置 Chromium 路径</Button>
    </div>
  );
}
