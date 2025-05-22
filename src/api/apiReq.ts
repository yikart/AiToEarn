import sxRequest from "@/utils/request";

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
}

export interface RegistCheckParams {
  code: string;
  mail: string;
  password: string;
  inviteCode: string;
}

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

// 检查注册状态
export const checkRegistStatusApi = (data: RegistCheckParams) => {
  return sxRequest.get<LoginResponse>(`user/login/mail/regist/back`, data);
};
