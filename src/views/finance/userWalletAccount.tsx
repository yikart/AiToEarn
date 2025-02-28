/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 21:48:18
 * @LastEditors: nevin
 * @Description: 用户的钱包账户 userWalletAccount
 */
import { Button } from 'antd';
import { useState, useEffect, useRef } from 'react';
import { TaskInfoRef } from '../task/components/popInfo';
import TaskInfo from '../task/components/popInfo';
import { UserWalletAccount } from '@/api/types/userWalletAccount';
import { financeApi } from '@/api/finance';

export default function Page() {
  const [walletAccountList, setWalletAccountList] = useState<
    UserWalletAccount[]
  >([]);

  const Ref_TaskInfo = useRef<TaskInfoRef>(null);

  async function getTaskList() {
    const res = await financeApi.getUserWalletAccountList();
    setWalletAccountList(res);
  }

  useEffect(() => {
    getTaskList();
  }, []);

  return (
    <div>
      <TaskInfo ref={Ref_TaskInfo} />
      <div>
        ƒ{' '}
        {walletAccountList.map((v) => {
          return (
            <div key={v.id}>
              {v.phone}
              <Button type="primary">查看</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
