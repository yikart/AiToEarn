import type {
  AccountGroupItem,
  SocialAccount,
  UpdateAccountStatisticsParams,
} from '@/api/types/account.type'
// 创建或更新账户
import http from '@/utils/request'

export function createOrUpdateAccountApi(data: Partial<SocialAccount>) {
  return http.post<SocialAccount>('account/login', data)
}

// 更新账户
export function updateAccountApi(data: Partial<SocialAccount>) {
  return http.post<SocialAccount>('account/update', data)
}

// 更新账户状态
export function updateAccountStatusApi(data: {
  id: string
  status: number
}) {
  return http.post<SocialAccount>('account/status', data)
}

// 获取账户列表
export function getAccountListApi() {
  return http.get<SocialAccount[]>('account/list/all')
}

// 获取账户详情
export function getAccountDetailApi(id: string) {
  return http.get<SocialAccount>(`account/${id}`)
}

export function updateAccountStatisticsApi(data: UpdateAccountStatisticsParams) {
  return http.post<SocialAccount>('account/statistics/update', data)
}

// 删除账户
export function deleteAccountApi(id: string) {
  return http.post<SocialAccount>(`account/delete/${id}`)
}

// 删除多个账户
export function deleteAccountsApi(ids: string[]) {
  return http.post<SocialAccount>('account/deletes', {
    ids,
  })
}

// 创建账户组
export function createAccountGroupApi(data: Partial<AccountGroupItem>) {
  return http.post('accountGroup/create', data)
}

// 更新账户组
export function updateAccountGroupApi(data: Partial<AccountGroupItem>) {
  return http.post('accountGroup/update', data)
}

// 删除账户组
export function deleteAccountGroupApi(ids: string[]) {
  return http.post('accountGroup/deletes', {
    ids,
  })
}

// 获取所有账户组
export async function getAccountGroupApi() {
  const res: any = await http.get<AccountGroupItem[]>('accountGroup/getList')
  // res.data.push({
  //   id: "68a6d3e5861d0b23ca010123",
  //   ip: "188.166.188.86",
  //   isDefault: false,
  //   location: "AU",
  //   name: "测试外网",
  //   proxyIp: "188.166.188.86",
  //   rank: 1,
  //   userId: "689aea2a2b50f147c09f01bc",
  //   _id: "68a6d3e5861d0b23ca010123",
  // });

  return res
}
