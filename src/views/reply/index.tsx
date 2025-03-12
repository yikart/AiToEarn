/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:36:53
 * @LastEditors: nevin
 * @Description: 评论页面 reply
 */
import { icpCreatorList, icpGetCommentList, WorkData } from '@/icp/reply';
import { Button } from 'antd';
import { useCallback, useState } from 'react';
import AccountSidebar from '../account/components/AccountSidebar/AccountSidebar';
export default function Page() {
  const [wordList, setWordList] = useState<WorkData[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<number>(-1);

  async function getCreatorList() {
    const res = await icpCreatorList(activeAccountId, {
      pageNo: 1,
      pageSize: 10,
    });
    setWordList(res.list);
    console.log('----- res', res);
  }

  /**
   * 获取评论列表
   */
  async function getCommentList(dataId: string) {
    const res = await icpGetCommentList(activeAccountId, dataId);
    setWordList(res.list);
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
        <div>
          {wordList.map((item) => (
            <div key={item.dataId}>
              {item.title}
              <Button
                type="primary"
                onClick={() => getCommentList(item.dataId)}
              >
                获取评论列表
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
