import http from "@/utils/request";

export type WalletType = "ZFB" | "WX_PAY";

export interface UserWalletAccountCreateDto {
  userId: string;
  mail: string; // email
  userName?: string;
  account: string;
  cardNum?: string;
  phone?: string;
  type: WalletType;
}

export interface UserWalletAccount extends UserWalletAccountCreateDto {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export function createUserWalletAccount(data: UserWalletAccountCreateDto) {
  return http.post<UserWalletAccount>("userWalletAccount", data);
}

export function updateUserWalletAccount(id: string, data: Partial<UserWalletAccountCreateDto>) {
  return http.put<UserWalletAccount>("userWalletAccount", { id, ...data });
}

export function deleteUserWalletAccount(id: string) {
  return http.delete<null>(`userWalletAccount/${id}`);
}

export function getUserWalletAccountInfo(id: string) {
  return http.get<UserWalletAccount>(`userWalletAccount/info/${id}`);
}

export function getUserWalletAccountList(pageNo: number, pageSize: number) {
  return http.get<{ list: UserWalletAccount[]; total: number }>(`userWalletAccount/list/${pageNo}/${pageSize}`);
}

export const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;


