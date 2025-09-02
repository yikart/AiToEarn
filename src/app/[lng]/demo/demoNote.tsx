"use client";

import { getNotificationList } from "@/api/notification";

export const DemoNotification = () => {
  async function doGetNotificationList() {
    const res = await getNotificationList({ page: 1, pageSize: 20 });
    console.log("------ createMaterialGroup ---- ", res);
  }

  return (
    <div>
      <div>========= 通知消息 ==============</div>
      <div>
        <button onClick={doGetNotificationList}>获取通知消息列表</button>
      </div>
    </div>
  );
};
