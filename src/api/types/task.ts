import { TaskType } from 'commont/types/task';
import { ApiCorrectQuery } from '.';

export enum UserTaskStatus {
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  PENDING_REWARD = 'pending_reward', // 待发放奖励
  REWARDED = 'rewarded', // 已发放奖励
}

export interface TaskListParams extends ApiCorrectQuery {
  type?: TaskType;
  keyword?: string;
  productLevel?: string;
  requiresShoppingCart?: boolean;
}

export interface MineTaskListParams extends ApiCorrectQuery {
  type?: TaskType;
  keyword?: string;
  status?: UserTaskStatus;
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
