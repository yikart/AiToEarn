import type { IncomeRecord } from './types/income'
import { request } from '@/utils/request'

/**
 * 获取收入列表
 */
export function apiGetIncomeList(page: {
  pageNo: number
  pageSize: number
}, params: {
  type?: string
}) {
  return request<{ list: IncomeRecord[], total: number }>({
    url: `income/list/${page.pageNo}/${page.pageSize}`,
    method: 'GET',
    params,
  })
}

/**
 * 提交提现
 */
export function apiSubmitWithdraw(incomeRecordId: string, userWalletAccountId?: string, flowId?: string) {
  return request<any>({
    url: `income/withdraw`,
    method: 'POST',
    data: {
      incomeRecordId,
      userWalletAccountId,
      flowId,
    },
  })
}
