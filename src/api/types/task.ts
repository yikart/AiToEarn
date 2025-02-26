import { TaskType } from 'commont/types/task';
import { ApiCorrectQuery } from '.';

export interface TaskListParams extends ApiCorrectQuery {
  type?: TaskType;
  keyword?: string;
  productLevel?: string;
  requiresShoppingCart?: boolean;
}

export interface IUserInfo {
  _id: string;
  id: string;
  name: string;
  phone: string;
  gender: number;
  avatar: string;
  desc: string;
}

export interface IRefreshToken {
  token: string;
  userInfo: IUserInfo;
  // 过期时间。秒
  exp: number;
}
