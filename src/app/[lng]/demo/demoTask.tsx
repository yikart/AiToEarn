"use client";
import { apiAcceptTask, apiGetTaskOpportunityList, TaskOpportunity } from "@/api/task";
import { useState } from "react";

export const DemoTask = () => {
  const [result, setResult] = useState<TaskOpportunity[]>([]);

  

  async function getTaskOpportunityList() {
    const res = await apiGetTaskOpportunityList({ page: 1, pageSize: 20 });
    console.log("------ createMaterialGroup ---- ", res);
    if(!res) return;
    setResult(res.data.list);
  }

  async function acceptTask(opportunityId:string) {
    console.log(`----`, opportunityId);
    
    const res = await apiAcceptTask(opportunityId)
    console.log('----- res', res);
  }

  return (
    <div>
      <div>========= 通知消息 ==============</div>
      <div>
        <button onClick={getTaskOpportunityList}>获取发放给我的任务列表</button>

{/* 待接受任务列表 */}
        <div>

          {result.map((item) => (
            <div key={item._id}>
              <div>{item._id}</div>
              <div>{item.accountId}</div>
              <div>{item.accountType}</div>
              <div>{item.status}</div>
              <button onClick={()=>acceptTask(item._id)}>接受任务</button>
            </div>
          ))}
        </div>

{/* 已接受任务列表 */}
        <div>

          {result.map((item) => (
            <div key={item._id}>
              <div>{item._id}</div>
              <div>{item.accountId}</div>
              <div>{item.accountType}</div>
              <div>{item.status}</div>
              <button onClick={()=>acceptTask(item._id)}>接受任务</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
