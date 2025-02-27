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

export interface UserTask {
  id: string;
  userId: string;
  taskId: string;
  status: UserTaskStatus;
  submissionUrl?: string; // 提交的视频、文章或截图URL
  screenshotUrls?: string[]; // 任务完成截图
  qrCodeScanResult?: string; // 二维码扫描结果
  submissionTime?: Date; // 提交时间
  completionTime?: Date; // 完成时间
  rejectionReason?: string; // 拒绝原因
  metadata?: Record<string, any>; // 额外信息，如审核反馈等
  isFirstTimeSubmission: boolean; // 是否首次提交，用于确定是否给予首次奖励
  earnedCommission?: number; // 实际获得的佣金
  verificationNote?: string; // 人工核查备注
  rewardAmount?: number; // 奖励金额
  rewardTime?: Date; // 奖励发放时间
  keyword?: string;
  productLevel?: string;
  verifiedBy?: string; // 核查人员ID
}
