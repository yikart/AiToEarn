import http from '@/utils/request'

// 获取广告账户
export function getPinterestAccountApi(adAccountId: string) {
  return http.get<any>(`plat/pinterest/account/${adAccountId}`)
}

// 创建广告用户
export function createPinterestAdAccountApi(adAccountId: string) {
  return http.get<any>(`plat/pinterest/AdAccount/${adAccountId}`)
}

// 获取pinterest账户列表
export function getPinterestAccountListApi() {
  return http.get<any>('plat/pinterest/account')
}

// 创建board
export function createPinterestBoardApi(data: any, accountId: string) {
  return http.post<any>('plat/pinterest/board', { ...data, accountId })
}

// 获取board列表信息
export function getPinterestBoardListApi(params: any, accountId: string) {
  return http.get<any>('plat/pinterest/board', { ...params, accountId })
}

// 获取单个board
export function getPinterestBoardApi(id: string, accountId: string) {
  return http.get<any>(`plat/pinterest/board/${id}`, { accountId })
}

// 删除单个board
export function deletePinterestBoardApi(id: string, accountId: string) {
  return http.delete<any>(`plat/pinterest/board/${id}`, { accountId })
}

// 创建pin
export function createPinterestPinApi(data: any, accountId: string) {
  return http.post<any>('plat/pinterest/pin', { ...data, accountId })
}

// 获取pin列表
export function getPinterestPinListApi(params: any, accountId: string) {
  return http.get<any>('plat/pinterest/pin', { ...params, accountId })
}

// 获取单个pin
export function getPinterestPinApi(id: string, accountId: string) {
  return http.get<any>(`plat/pinterest/pin/${id}`, { accountId })
}

// 删除pin
export function deletePinterestPinApi(id: string, accountId: string) {
  return http.delete<any>(`plat/pinterest/pin/${id}`, { accountId })
}
