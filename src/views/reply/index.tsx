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
import AccountSidebar from '../account/components/AccountSidebar';
export default function Page() {
  const [activeTab, setActiveTab] = useState('car');
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

  async function getCreatorList() {
    const res = await ipcCreatorList(activeAccountId);
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
      </div>
    </div>
  );
}
