import { PlatType } from "@/app/config/platConfig";
import { createKwaiAuth, getKwaiAuthStatus } from "@/api/plat/kwai";
import { sleep } from "@/utils";
import { useAccountStore } from "@/store/account";
import { useUserStore } from "@/store/user";

export async function kwaiSkip(platType: PlatType) {
  const res = await createKwaiAuth("pc");
  if (res?.code == 1) {
          useUserStore.getState().logout();
          return
        }
  if (!res?.data) return;
  window.open(res?.data.url);

  let queryCount = 0;
  const maxQueryCount = 30; // 最大轮询次数
  
  while (queryCount < maxQueryCount) {
    const autoStatusRes = await getKwaiAuthStatus(res.data.taskId);
    
    if (!autoStatusRes?.data) break;
    if (autoStatusRes.data.status === 1) {
      useAccountStore.getState().getAccountList();
      break;
    }

    queryCount++;
    await sleep(1000);
  }
  
  // 如果达到最大轮询次数仍未成功，记录日志
  if (queryCount >= maxQueryCount) {
    console.log('快手授权达到最大轮询次数，停止轮询');
  }
}
