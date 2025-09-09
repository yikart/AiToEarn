"use client";
import { apiGetIncomeList, apiSubmitWithdraw } from "@/api/income";
import { IncomeRecord } from "@/api/types/income";
import { apiGetWithdrawRecordList } from "@/api/withdraw";
import { useState } from "react";

export const DemoIncome = () => {
  const [result, setResult] = useState<IncomeRecord[]>([]);
  const [userTaskList, setUserTaskList] = useState<any[]>([]);

  async function getIncomeList() {
    const res = await apiGetIncomeList({ pageNo: 1, pageSize: 20 }, {});
    console.log("------ createMaterialGroup ---- ", res);
    if (!res) return;
    setResult(res.data.list);
  }

  async function submitWithdraw(opportunityId: string) {
    console.log(`----`, opportunityId);
    const res = await apiSubmitWithdraw(opportunityId)
    console.log('----- res', res);
  }


  async function getWithdrawRecordList() {
    const res = await apiGetWithdrawRecordList({ pageNo: 1, pageSize: 20 }, {});
    console.log("------ getUserTaskList ---- ", res);
    if (!res) return;
    setUserTaskList(res.data.list);
  }

  return (
    <div>
      <div>
        <button onClick={getIncomeList}>我的收入列表</button>

        {/* 待接受任务列表 */}
        <div>

          {result.map((item) => (
            <div key={item._id}>
              <div>{item._id}</div>
              <button onClick={() => submitWithdraw(item._id)}>申请提现</button>
            </div>
          ))}
        </div>


        <button onClick={getWithdrawRecordList}>获取我的提现列表</button>
        {/* 已接受任务列表 */}
        <div>

          {userTaskList.map((item) => (
            <div key={item._id}>
              <div>{item._id}</div>
              <div>{item.accountId}</div>
              <div>{item.accountType}</div>
              <div>{item.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
