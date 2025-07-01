import { PlatType } from "@/app/config/platConfig";
import { addKwaiAccountApi, getKwaiAuthUrlApi } from "@/api/plat/kwai";

export const kwaiAppId = "ks715790869885446758";

export async function kwaiSkip(platType: PlatType) {
  const res = await getKwaiAuthUrlApi(
    "pc",
    `${location.origin}/accounts/add?platType=${platType}`,
  );
  if (!res?.data) return;
  window.open(res?.data);
}

export function kwaiLogin(code: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await addKwaiAccountApi(code);
      resolve(!!res?.data);
    } catch (e) {
      reject(e);
    }
  });
}
