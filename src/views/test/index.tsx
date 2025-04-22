/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 17:00:45
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { useState } from 'react';
import { Button } from 'antd';
import { ipcGetLogFlies, ipcUpFlie } from '@/icp/tools';
import log from 'electron-log/renderer';
export default function Test() {
  const [filePathList, setFilePathList] = useState<string[]>([]);
  const [filePath, setFilePath] = useState<string>('');

  function addLog() {
    log.info('------3333333-----');
  }
  async function getLogFilePathList() {
    const res = await ipcGetLogFlies();
    setFilePathList(res);
  }

  return (
    <div>
      <Button
        onClick={() => {
          getLogFilePathList();
        }}
      >
        获取日志文件列表
      </Button>

      <Button
        onClick={() => {
          addLog();
        }}
      >
        前端产生日志
      </Button>

      <Button
        onClick={() => {
          ipcUpFlie(filePath);
        }}
      >
        上传日志文件
      </Button>

      <div>
        {filePathList.map((item) => (
          <div onClick={() => setFilePath(item)} key={item}>
            {item}
          </div>
        ))}
      </div>

      <br />
      <div>当前:{filePath}</div>
    </div>
  );
}
