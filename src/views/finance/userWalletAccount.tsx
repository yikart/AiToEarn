/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-02-28 22:09:10
 * @LastEditors: nevin
 * @Description: 用户的钱包账户 userWalletAccount
 */
import { Button } from 'antd';
import { useState, useEffect, useRef } from 'react';
import AddWalletAccount from './components/addWalletAccount';
import { UserWalletAccount } from '@/api/types/userWalletAccount';
import { financeApi } from '@/api/finance';
import { AddWalletAccountRef } from './components/addWalletAccount';

export default function Page() {
  const [walletAccountList, setWalletAccountList] = useState<
    UserWalletAccount[]
  >([]);

  const Ref_AddWalletAccountRef = useRef<AddWalletAccountRef>(null);

  async function getTaskList() {
    const res = await financeApi.getUserWalletAccountList();
    setWalletAccountList(res);
  }

  // 新建
  async function createUserWalletAccount() {
    Ref_AddWalletAccountRef.current?.init();
  }

  useEffect(() => {
    getTaskList();
  }, []);

  return (
    <div>
      <Button type="primary" onClick={createUserWalletAccount}>
        新建
      </Button>

      <AddWalletAccount ref={Ref_AddWalletAccountRef} />
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
