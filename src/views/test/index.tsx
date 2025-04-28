/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-04-01 17:00:45
 * @LastEditors: nevin
 * @Description: 测试页面
 */
import { Button } from 'antd';
export default function Test() {
  async function getLogFilePathList() {
    const res = await window.ipcRenderer.invoke('ICP_GET_FILE_MATE_INFO');
    console.log('-----', res);
  }

  return (
    <div>
      <Button
        onClick={() => {
          getLogFilePathList();
        }}
      >
        测试事件
      </Button>
    </div>
  );
}
