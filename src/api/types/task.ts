/*
 * @Author: nevin
 * @Date: 2025-03-01 19:27:35
 * @LastEditTime: 2025-03-24 14:10:43
 * @LastEditors: nevin
 * @Description:
 */
import { Task, TaskDataInfo, TaskType } from 'commont/types/task';
import { ApiCorrectQuery } from '.';
import { AccountType } from '@@/AccountEnum';

export enum UserTaskStatus {
  DODING = 'doing', // 进行中
  PENDING = 'pending', // 待审核
  APPROVED = 'approved', // 已通过
  REJECTED = 'rejected', // 已拒绝
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  // PENDING_REWARD = 'pending_reward', // 待发放奖励
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

export interface UserTask<T extends Task<TaskDataInfo> | string> {
  _id: string;
  id: string;
  userId: string;
  taskId: T;
  status: UserTaskStatus;
  submissionUrl?: string; // 提交的视频、文章或截图URL
  screenshotUrls?: string[]; // 任务完成截图
  qrCodeScanResult?: string; // 二维码扫描结果
  submissionTime?: string; // 提交时间
  completionTime?: string; // 完成时间
  rejectionReason?: string; // 拒绝原因
  metadata?: Record<string, any>; // 额外信息，如审核反馈等
  isFirstTimeSubmission: boolean; // 是否首次提交，用于确定是否给予首次奖励
  verificationNote?: string; // 人工核查备注
  reward: number; // 佣金金额
  rewardTime?: string; // 奖励发放时间
  keyword?: string;
  productLevel?: string;
  verifiedBy?: string; // 核查人员ID
  createTime: string;
  updateTime: string;
}

export interface ApplyTask {
  account: string;
  uid: string;
  accountType: AccountType;
  taskMaterialId?: string; // 任务素材ID
}

export interface TaskArticleImg {
  content: string;
  imageUrl: string;
}

export interface TaskMaterial {
  id: string;
  taskId: string;
  type: TaskType;
  title?: string; // 标题
  coverUrl?: string; // 封面图
  temp?: string; // 模板字符
  desc?: string;
  imageList: TaskArticleImg[];
  usedCount: number;
  createTime: string;
  updateTime: string;
}
