/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 16:15:14
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { useState } from 'react';
import VideoChoose, { IVideoFile } from '@/components/Choose/VideoChoose';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function Text() {
  const [videoPath, setVideoPath] = useState('');

  function addVideos(videoFiles: IVideoFile[]) {
    const theVideoPath = videoFiles[0].videoPath;
    console.log('--------- theVideoPath', theVideoPath);
    setVideoPath(theVideoPath);
  }

  async function getFileMateInfo() {
    const res = await window.ipcRenderer.invoke(
      'ICP_GET_FILE_MATE_INFO',
      videoPath,
    );
    console.log('---- res ----', res);
  }

  return (
    <div>
      <VideoChoose
        onMultipleChoose={(videoFiles) => {
          addVideos(videoFiles);
        }}
        onStartShoose={() => {}}
        onChooseFail={() => {}}
      >
        <Button type="dashed" icon={<PlusOutlined />}>
          批量添加
        </Button>
      </VideoChoose>

      <Button
        onClick={() => {
          getFileMateInfo();
        }}
      >
        获取文件信息
      </Button>
    </div>
  );
}
