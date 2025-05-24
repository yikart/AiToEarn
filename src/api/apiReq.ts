import sxRequest from "@/utils/request";
import { UserInfo } from "@/store/user";

export interface ResponseType<T> {
  code: string | number;
  data: T;
  msg: string;
  url: string;
}

export interface LoginResponse {
  type: 'regist' | 'login';  // 登录类型：regist-需要注册，login-直接登录
  token?: string;
  registUrl?: string;
  code?: string;  // 注册码
  userInfo?: UserInfo;  // 用户信息
}

export interface RegistCheckParams {
  code: string;
  mail: string;
  password: string;
  inviteCode: string;
}

// 获取用户信息
export const getUserInfoApi = () => {
  return sxRequest.get<UserInfo>("user/mine");
};

// 更新用户信息
export const updateUserInfoApi = (data: { name: string }) => {
  return sxRequest.put<UserInfo>("user/info/update", data);
};

export const getMoneyStampApi = () => {
  return sxRequest.get<any>("cfg/money/stamp");
};

export const fluxSchnellApi = (data: any) => {
  return sxRequest.post<any>("experience-ai/text2image/flux_schnell", data);
};

// 邮箱登录接口
export const loginWithMailApi = (data: { mail: string; password: string }) => {
  return sxRequest.post<LoginResponse>("user/login/mail", data);
};

// 获取注册链接
export const getRegistUrlApi = (mail: string) => {
  return sxRequest.get<LoginResponse>(`user/login/mail/regist/url?mail=${mail}`);
};

// 检查注册状态 post!!
export const checkRegistStatusApi = (data: RegistCheckParams) => {
  return sxRequest.post<LoginResponse>(`user/login/mail/regist/back`, data);
};

// 发送重置密码邮件
export const sendResetPasswordMailApi = (data: { mail: string }) => {
  return sxRequest.post<LoginResponse>("user/login/repassword/mail", data);
};

// 重置密码
export const resetPasswordApi = (data: { code: string; mail: string; password: string }) => {
  return sxRequest.post<LoginResponse>("user/login/repassword/mail/back", data);
};

// 三方账户类型定义
export interface SocialAccount {
  id: number;
  type: string;
  loginCookie: string;
  loginTime: string;
  uid: string;
  account: string;
  avatar: string;
  nickname: string;
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  forwardCount: number;
  commentCount: number;
  lastStatsTime: string;
  workCount: number;
  income: number;
  status: number;
  createTime: string;
  updateTime: string;
}

// 创建或更新账户
export const createOrUpdateAccountApi = (data: Omit<SocialAccount, 'id'>) => {
  return sxRequest.post<SocialAccount>("account/login", data);
};

// 更新账户状态
export const updateAccountStatusApi = (data: { id: number; status: number }) => {
  return sxRequest.post<SocialAccount>("account/status", data);
};

// 获取账户列表
export const getAccountListApi = () => {
  return sxRequest.get<SocialAccount[]>("account/list/all");
};

// 获取账户详情
export const getAccountDetailApi = (id: number) => {
  return sxRequest.get<SocialAccount>(`account/${id}`);
};

// 更新账户统计数据
export interface UpdateAccountStatisticsParams {
  id: number;
  fansCount: number;
  readCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  income: number;
  workCount: number;
}

export const updateAccountStatisticsApi = (data: UpdateAccountStatisticsParams) => {
  return sxRequest.post<SocialAccount>("account/statistics/update", data);
};

// 删除账户
export const deleteAccountApi = (id: number) => {
  return sxRequest.post<SocialAccount>(`account/delete/${id}`);
};
