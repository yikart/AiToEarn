import type { UserInfo } from '@/store/user'
import http from '@/utils/request'

export interface LoginResponse {
  token?: string
  userInfo?: UserInfo
}

// 获取用户信息
export function getUserInfoApi() {
  return http.get<UserInfo>('user/mine')
}

// 更新用户信息
export function updateUserInfoApi(data: { name: string, avatar?: string }) {
  return http.put<UserInfo>('user/info/update', data)
}

export function getMoneyStampApi() {
  return http.get<any>('cfg/money/stamp')
}

export function fluxSchnellApi(data: any) {
  return http.post<any>('experience-ai/text2image/flux_schnell', data)
}

// Google 登录参数
export interface GoogleLoginParams {
  clientId: string
  credential: string
  placeId?: string
}

// Google 登录
export function googleLoginApi(data: GoogleLoginParams) {
  return http.post<LoginResponse>('login/google', data)
}

// 积分记录相关API
export async function getPointsRecordsApi(params: { page: number, pageSize: number }) {
  const res = await http.get<any>(`user/points/records`, params)
  return res
}

// 积分充值相关API
export interface RechargePointsParams {
  amount: number // 充值数量（1000积分为单位）
  totalPrice: number // 总价格
}

export function rechargePointsApi(data: RechargePointsParams) {
  return http.post<any>('user/points/recharge', data)
}
