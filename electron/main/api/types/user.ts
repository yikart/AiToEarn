// 用户状态
export type UserStatus = 0 | 1 | -1;

// 用户信息
export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  desc?: string;
  status: UserStatus;
  createTime: Date;
  updateTime: Date;
}

// 用户登录返回
export interface LoginResponse {
  userInfo: UserInfo;
  token: string;
}

// 手机号验证码登录DTO
export interface PhoneLoginByCodeDto {
  phone: string;
  code: string;
  inviteCode?: string;
}

// 密码登录DTO
export interface LoginByPasswordDto {
  phone: string;
  password: string;
  inviteCode?: string;
}

// 修改密码DTO
export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

// 更新用户信息DTO
export interface UpdateUserInfoDto {
  name?: string;
  avatar?: string;
  desc?: string;
}

// 获取验证码DTO
export interface GetRegisterCodeDto {
  phone: string;
}

// 手机号注册DTO
export interface PhoneRegisterDto {
  code: string;
  phone: string;
  password: string;
  inviteCode?: string;
}
