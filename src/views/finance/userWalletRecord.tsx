/*
 * @Author: nevin
 * @Date: 2025-02-10 22:20:15
 * @LastEditTime: 2025-03-02 22:12:39
 * @LastEditors: nevin
 * @Description: 用户金额记录 userWalletRecord
 */
import { Card } from 'antd';
import { useState, useEffect, useRef } from 'react';
import AddWalletAccount from './components/addWalletAccount';
import { financeApi } from '@/api/finance';
import { AddWalletAccountRef } from './components/addWalletAccount';
import { UserWalletRecord } from '@/api/types/finance';

export default function Page() {
  const [walletAccountList, setWalletAccountList] = useState<
    UserWalletRecord[]
  >([]);

  const Ref_AddWalletAccountRef = useRef<AddWalletAccountRef>(null);

  async function getDataList() {
    const res = await financeApi.getWithdrawList({
      page: 1,
      pageSize: 10,
    });
    setWalletAccountList(res.items);
  }

  useEffect(() => {
    getDataList();
  }, []);

  return (
    <div>
      <AddWalletAccount ref={Ref_AddWalletAccountRef} />
      <div>
        {walletAccountList.map((v) => {
          return (
            <Card key={v.id}>
              <p>手机号{v.account.phone} </p>
              <p>账户号{v.account.account} </p>
              <p>类型{v.account.type} </p>
              <p>金额{v.balance} </p>
              <p>状态{v.status} </p>
              <p>付款证明截图：{v.imgUrl} </p>
              <p>付款时间：{v.payTime} </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
