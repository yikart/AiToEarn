/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { ipcCreatorList } from '@/icp/reply';
import { Button } from 'antd';
import { useCallback, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
import { ipcDownFile } from '@/icp/tools';
export default function Page() {
  const [activeTab, setActiveTab] = useState('car');
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

  async function getCreatorList() {
    const res = await ipcCreatorList(activeAccountId);
    console.log('----- res', res);
  }

  async function downFile() {
    const res = await ipcDownFile(
      'https://ai-to-earn.oss-cn-beijing.aliyuncs.com/development/temp/nopath/202503/f1cffb9c-c42a-4fcc-8516-0e2c276ee2f8.mp4',
      'default_filename',
    );
    console.log('----- res', res);
  }

  return (
    <div>
      <div>
        <AccountSidebar
          activeAccountId={activeAccountId}
          onAccountChange={useCallback((info) => {
            setActiveAccountId(info.id);
          }, [])}
        />
      </div>
      <div>
        <Button type="primary" onClick={getCreatorList}>
          获取列表
        </Button>

        <Button type="primary" onClick={downFile}>
          下载文件
        </Button>
      </div>
    </div>
  );
}
