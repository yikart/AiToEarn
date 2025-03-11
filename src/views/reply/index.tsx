/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { ipcCreatorList } from '@/icp/reply';
import { Button } from 'antd';
import { useState } from 'react';
export default function Page() {
  const [activeTab, setActiveTab] = useState('car');

  async function getCreatorList() {
    const res = await ipcCreatorList();
    console.log('----- res', res);
  }

  return (
    <div>
      <div>
        <Button type="primary" onClick={getCreatorList}>
          获取列表
        </Button>
      </div>
    </div>
  );
}
