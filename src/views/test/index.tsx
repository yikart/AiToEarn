/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 17:00:45
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { useState } from 'react';
import { Button } from 'antd';
import { ipcGetLogFlies } from '@/icp/tools';
import log from 'electron-log/renderer';
export default function Test() {
  const [filePathList, setFilePathList] = useState<string[]>([]);

  function addLog() {
    log.info('------3333333-----');
  }
  async function getLogFilePathList() {
    const res = await ipcGetLogFlies();
    console.log('--------upLog-- res', res);
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

      <div>
        {filePathList.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
    </div>
  );
}
