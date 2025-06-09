// 创建或更新账户
import sxRequest from "@/utils/request";
import {
  AccountGroupItem,
  SocialAccount,
  UpdateAccountStatisticsParams,
} from "@/api/types/account.type";

export const createOrUpdateAccountApi = (data: Partial<SocialAccount>) => {
  return sxRequest.post<SocialAccount>("account/login", data);
};

// 更新账户
export const updateAccountApi = (data: Partial<SocialAccount>) => {
  return sxRequest.post<SocialAccount>("account/update", data);
};

// 更新账户状态
export const updateAccountStatusApi = (data: {
  id: string;
  status: number;
}) => {
  return sxRequest.post<SocialAccount>("account/status", data);
};

// 获取账户列表
export const getAccountListApi = () => {
  return sxRequest.get<SocialAccount[]>("account/list/all");
};

// 获取账户详情
export const getAccountDetailApi = (id: string) => {
  return sxRequest.get<SocialAccount>(`account/${id}`);
};

export const updateAccountStatisticsApi = (
  data: UpdateAccountStatisticsParams,
) => {
  return sxRequest.post<SocialAccount>("account/statistics/update", data);
};

// 删除账户
export const deleteAccountApi = (id: string) => {
  return sxRequest.post<SocialAccount>(`account/delete/${id}`);
};

// 删除多个账户
export const deleteAccountsApi = (ids: string[]) => {
  return sxRequest.post<SocialAccount>("account/deletes", {
    ids,
  });
};

// 创建账户组
export const createAccountGroupApi = (data: Partial<AccountGroupItem>) => {
  return sxRequest.post("accountGroup/create", data);
};

// 更新账户组
export const updateAccountGroupApi = (data: Partial<AccountGroupItem>) => {
  return sxRequest.post("accountGroup/update", data);
};

// 删除账户组
export const deleteAccountGroupApi = (ids: string[]) => {
  return sxRequest.post("accountGroup/deletes", {
    ids,
  });
};

// 获取所有账户组
export const getAccountGroupApi = () => {
  return sxRequest.get<AccountGroupItem[]>("accountGroup/getList");
};
