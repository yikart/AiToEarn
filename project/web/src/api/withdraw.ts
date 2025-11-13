import type { WithdrawRecord } from './types/withdraw'
import { request } from '@/utils/request'

/**
 * 获取提现列表
 */
export function apiGetWithdrawRecordList(page: { pageNo: number, pageSize: number }, params: { status?: number }) {
  return request<{ list: WithdrawRecord[], total: number }>({
    url: `withdraw/list/${page.pageNo}/${page.pageSize}`,
    method: 'GET',
    params,
  })
}
