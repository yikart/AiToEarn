// 账户和分组排序API接口
import http from '@/utils/request'

export interface SortRankItem {
  id: string
  rank: number
}

export interface SortRankRequest {
  list: SortRankItem[]
}

export interface AccountSortRankRequest {
  groupId: string
  list: SortRankItem[]
}

/**
 * 更新分组排序
 * @param data 排序数据
 * @returns
 */
export function apiUpdateAccountGroupSortRank(data: SortRankRequest) {
  return http.put('accountGroup/sortRank', data)
}

/**
 * 更新账户排序
 * @param data 排序数据
 * @returns
 */
export function apiUpdateAccountSortRank(data: AccountSortRankRequest) {
  return http.put('account/sortRank', data)
}
