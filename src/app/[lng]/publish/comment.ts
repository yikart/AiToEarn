import { SocialAccount } from "@/api/types/account.type";
import { AccountStatus } from "@/app/config/accountConfig";

// export type PubRecordModel = PubRecordModelLast;

// 接口失效处理
export async function accountFailureDispose<T>(
  {
    status,
    data,
  }: {
    status: number;
    data?: T;
  },
  account: SocialAccount,
  callback: (account: SocialAccount) => void,
) {
  if (status !== 200 && status !== 201) {
    if (status === 401) {
      account.status = AccountStatus.DISABLE;
      callback(account);
      // await ipcUpdateAccountStatus(account.id, AccountStatus.DISABLE);
    }
    return [];
  }
  return data || [];
}
