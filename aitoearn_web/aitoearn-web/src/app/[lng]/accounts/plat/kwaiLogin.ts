import { PlatType } from "@/app/config/platConfig";
import { createKwaiAuth, getKwaiAuthStatus } from "@/api/plat/kwai";
import { sleep } from "@/utils";
import { useAccountStore } from "@/store/account";

export const kwaiAppId = "ks715790869885446758";

export async function kwaiSkip(platType: PlatType) {
  const res = await createKwaiAuth("pc");
  if (!res?.data) return;
  window.open(res?.data.url);

  let queryCount = 0;
  while (queryCount < 120) {
    const autoStatusRes = await getKwaiAuthStatus(res.data.taskId);
    if (!autoStatusRes?.data) break;
    if (autoStatusRes.data.status === 1) {
      useAccountStore.getState().getAccountList();
      break;
    }

    queryCount++;
    await sleep(1000);
  }
}
