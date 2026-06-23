import type { AccountGroupItem, AccountListData, CreateChannelAccountParams, SocialAccount, SortRankRequest } from './account.types'
import http from '@/utils/request'

// Source: account.ts
function buildArrayQueryUrl(path: string, key: string, values: string[]) {
  const query = new URLSearchParams()
  values.forEach(value => query.append(key, value))
  return `${path}?${query.toString()}`
}

/**
 * 创建账号
 * 仅支持插件授权平台创建账号
 */
export function createChannelAccountApi(data: CreateChannelAccountParams) {
  return http.post<SocialAccount>('v2/channels/accounts', data)
}

/**
 * 账号列表
 */
export function getAccountListApi() {
  return http.get<AccountListData>('v2/channels/accounts')
}

/**
 * 账号详情
 */
export function getAccountDetailApi(id: string) {
  return http.get<SocialAccount>(`v2/channels/accounts/${id}`)
}

/**
 * 账号数据
 */
export function refreshAccountFansApi(id: string) {
  return http.get(`v2/channels/accounts/${encodeURIComponent(id)}/analytics`)
}

/**
 * 删除账号
 */
export function deleteAccountApi(id: string) {
  return http.delete<boolean>(`v2/channels/accounts/${id}`)
}

/**
 * 创建账号分组
 */
export function createAccountGroupApi(data: Partial<AccountGroupItem>) {
  return http.post<AccountGroupItem>('v2/channels/account-groups', data)
}

/**
 * 更新账号分组
 */
export function updateAccountGroupApi(data: Partial<AccountGroupItem>) {
  const { id, ...payload } = data
  return http.patch<AccountGroupItem>(`v2/channels/account-groups/${id}`, payload)
}

/**
 * 删除账号分组
 */
export function deleteAccountGroupApi(ids: string[]) {
  return http.delete<boolean>(buildArrayQueryUrl('v2/channels/account-groups', 'ids', ids))
}

/**
 * 账号分组列表
 */
export function getAccountGroupApi() {
  return http.get<AccountGroupItem[]>('v2/channels/account-groups')
}

/**
 * 更新分组排序
 * @param data 排序数据
 * @returns 排序更新结果
 */
export async function apiUpdateAccountGroupSortRank(data: SortRankRequest) {
  const results = await Promise.all(
    data.list.map(item => http.patch(`v2/channels/account-groups/${item.id}`, { rank: item.rank })),
  )

  const failedResult = results.find(result => result?.code !== 0)
  return failedResult ?? { code: 0, data: true, message: '', url: '' }
}
