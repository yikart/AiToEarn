// 平台类型
export type PlatformType =
  | 'xiaohongshu'
  | 'wechat'
  | 'douyin'
  | 'bilibili'
  | 'shipinhao'
  | 'kuaishou';

// 平台状态
export type PlatformStatus = 0 | 1 | -1;

// 平台信息
export interface Platform {
  id: string;
  name: string;
  type: PlatformType;
  description?: string;
  icon?: string;
  status: PlatformStatus;
  sort?: number;
  config?: Record<string, any>;
}

// 创建平台DTO
export interface CreatePlatformDto {
  name: string;
  type: PlatformType;
  description?: string;
  icon?: string;
  sort?: number;
  config?: Record<string, any>;
  status: PlatformStatus;
}

// 更新平台DTO
export interface UpdatePlatformDto {
  name?: string;
  description?: string;
  icon?: string;
  sort?: number;
  config?: Record<string, any>;
  status?: PlatformStatus;
}

// 平台账号
export interface PlatformAccount {
  id: string;
  platformId: string;
  name: string;
  type: PlatformType;
  description?: string;
  avatar?: string;
  status: PlatformStatus;
  sort?: number;
  config?: Record<string, any>;
}

// 创建平台账号DTO
export interface CreatePlatformAccountDto {
  platformId: string;
  name: string;
  type: PlatformType;
  description?: string;
  avatar?: string;
  sort?: number;
  config?: Record<string, any>;
  status: PlatformStatus;
}

// 更新平台账号DTO
export interface UpdatePlatformAccountDto {
  name?: string;
  description?: string;
  avatar?: string;
  sort?: number;
  config?: Record<string, any>;
  status?: PlatformStatus;
}

// 平台账号分组
export interface PlatformAccountGroup {
  id: string;
  name: string;
  description?: string;
  status: PlatformStatus;
  sort?: number;
}

// 创建平台账号分组DTO
export interface CreatePlatformAccountGroupDto {
  name: string;
  description?: string;
  sort?: number;
  status: PlatformStatus;
}

// 更新平台账号分组DTO
export interface UpdatePlatformAccountGroupDto {
  name?: string;
  description?: string;
  sort?: number;
  status?: PlatformStatus;
}
