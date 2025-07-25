"use client";

import { apiGetAccountDataBulk, apiGetAccountDataCube } from "@/api/plat/dataCube";
const account = "686bc457e9a745f012552abf";

export const DemoData = () => {
  const getAccountDataCube = async () => {
    try {
      const res: any = await apiGetAccountDataCube(account);
      console.log("获取数据成功:---", res);

      if (res?.data?.data) {
        console.log("创建记录成功:", res.data.data);
      }
    } catch (error) {
      console.error("创建记录失败:", error);
    }
  };

    const getAccountDataBulk = async () => {
    try {
      const res: any = await apiGetAccountDataBulk(account);
      console.log("获取数据成功:---", res);

      if (res?.data?.data) {
        console.log("创建记录成功:", res.data.data);
      }
    } catch (error) {
      console.error("创建记录失败:", error);
    }
  };

  return (
    <div>
      <div style={{ marginTop: "20px" }}>
        <h3>数据板块测试：</h3>
        <div>
          <button onClick={getAccountDataCube}>获取账号总量数据</button>
          <button onClick={getAccountDataBulk}>获取账号增量数据</button>
        </div>
      </div>
    </div>
  );
};
