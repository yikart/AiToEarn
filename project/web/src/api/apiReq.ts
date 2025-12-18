import type { UserInfo } from "@/store/user";
import md5 from "blueimp-md5";
import http from "@/utils/request";

export interface LoginResponse {
  type: "regist" | "login"; // 登录类型：regist-需要注册，login-直接登录
  token?: string;
  registUrl?: string;
  code?: string; // 注册码
  userInfo?: UserInfo; // 用户信息
}

export interface RegistCheckParams {
  code: string;
  mail: string;
  password: string;
  inviteCode: string;
}

// 获取用户信息
export function getUserInfoApi() {
  return http.get<UserInfo>("user/mine");
}

// 更新用户信息
export function updateUserInfoApi(data: { name: string; avatar?: string }) {
  return http.put<UserInfo>("user/info/update", data);
}

export function getMoneyStampApi() {
  return http.get<any>("cfg/money/stamp");
}

export function fluxSchnellApi(data: any) {
  return http.post<any>("experience-ai/text2image/flux_schnell", data);
}

// 邮箱登录接口
export function loginWithMailApi(data: { mail: string; password: string }) {
  const hash = md5(data.password);
  return http.post<LoginResponse>("login/mail", {
    ...data,
    password: hash,
  });
}

// 获取注册链接
export function getRegistUrlApi(mail: string) {
  return http.get<LoginResponse>(`login/mail/regist/url?mail=${mail}`);
}

// 检查注册状态 post!!
export function checkRegistStatusApi(data: RegistCheckParams) {
  const hash = md5(data.password);
  return http.post<LoginResponse>(`login/mail/regist/back`, {
    ...data,
    password: hash,
  });
}

// 邮箱注册接口
export function mailRegistApi(data: {
  mail: string;
  code: string;
  password: string;
  inviteCode?: string;
}) {
  const hash = md5(data.password);
  return http.post<LoginResponse>("login/mail/regist", {
    ...data,
    password: hash,
  });
}

// 发送重置密码邮件
export function sendResetPasswordMailApi(data: { mail: string }) {
  return http.post<LoginResponse>("login/repassword/mail", data);
}

// 重置密码
export function resetPasswordApi(data: {
  code: string;
  mail: string;
  password: string;
}) {
  const hash = md5(data.password);
  return http.put<LoginResponse>("login/repassword/mail", {
    ...data,
    password: hash,
  });
}

// Google 登录参数
export interface GoogleLoginParams {
  clientId: string;
  credential: string;
}

// Google 登录
export function googleLoginApi(data: GoogleLoginParams) {
  return http.post<LoginResponse>("login/google", data);
}

// 积分记录相关API
export async function getPointsRecordsApi(params: {
  page: number;
  pageSize: number;
}) {
  const res = await http.get<any>(`user/points/records`, params);
  return res;
}

// 积分充值相关API
export interface RechargePointsParams {
  amount: number; // 充值数量（1000积分为单位）
  totalPrice: number; // 总价格
}

export function rechargePointsApi(data: RechargePointsParams) {
  return http.post<any>("user/points/recharge", data);
}
