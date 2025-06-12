import http from "@/utils/request";
import { UserInfo } from "@/store/user";

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
export const getUserInfoApi = () => {
  return http.get<UserInfo>("user/mine");
};

// 更新用户信息
export const updateUserInfoApi = (data: { name: string }) => {
  return http.put<UserInfo>("user/info/update", data);
};

export const getMoneyStampApi = () => {
  return http.get<any>("cfg/money/stamp");
};

export const fluxSchnellApi = (data: any) => {
  return http.post<any>("experience-ai/text2image/flux_schnell", data);
};

// 邮箱登录接口
export const loginWithMailApi = (data: { mail: string; password: string }) => {
  return http.post<LoginResponse>("login/mail", data);
};

// 获取注册链接
export const getRegistUrlApi = (mail: string) => {
  return http.get<LoginResponse>(`login/mail/regist/url?mail=${mail}`);
};

// 检查注册状态 post!!
export const checkRegistStatusApi = (data: RegistCheckParams) => {
  return http.post<LoginResponse>(`login/mail/regist/back`, data);
};

// 发送重置密码邮件
export const sendResetPasswordMailApi = (data: { mail: string }) => {
  return http.post<LoginResponse>("login/repassword/mail", data);
};

// 重置密码
export const resetPasswordApi = (data: {
  code: string;
  mail: string;
  password: string;
}) => {
  return http.post<LoginResponse>("login/repassword/mail/back", data);
};

// Google 登录参数
export interface GoogleLoginParams {
  clientId: string;
  credential: string;
}

// Google 登录
export const googleLoginApi = (data: GoogleLoginParams) => {
  return http.post<LoginResponse>("login/google", data);
};
