/*
 * @Author: nevin
 * @Date: 2025-01-21 21:12:52
 * @LastEditTime: 2025-03-19 15:10:28
 * @LastEditors: nevin
 * @Description:
 */
import { AutoRunType } from '../../db/models/autoRun';

export const autoRunTypeEtTag = new Map<AutoRunType, string>([
  [AutoRunType.ReplyComment, 'ET_AUTO_RUN_REPLY_COMMENT'],
]);

// 工具函数：解析周期类型
function parseCycleType(cycleType: string): { type: string; param: number } {
  const [_, type, paramStr] = cycleType.match(/(\w+)-(\d+)/) || [];
  return {
    type: type || '',
    param: parseInt(paramStr || '0'),
  };
}

// 核心判断函数
export function hasTriggered(
  cycleType: string,
  now: Date = new Date(),
): boolean {
  const { type, param } = parseCycleType(cycleType);
  const date = new Date(now);

  switch (type) {
    case 'day': // 每天HH点触发
      const hour = param;
      const todayTrigger = new Date(date);
      todayTrigger.setHours(hour, 0, 0, 0);
      if (todayTrigger <= date) {
        // 当前时间已过当日触发时间 → 已触发
        return true;
      } else {
        // 未到当日触发时间 → 未触发
        return false;
      }

    case 'week': // 每周D日触发（周日=0，周一=1，..., 周六=6）
      const targetDay = param;
      const daysAgo = (date.getDay() - targetDay + 7) % 7;
      const lastTrigger = new Date(date);
      lastTrigger.setDate(date.getDate() - daysAgo);
      lastTrigger.setHours(0, 0, 0, 0); // 设置为当天0点
      if (lastTrigger <= date) {
        // 当前时间已过最近触发日 → 已触发
        return true;
      } else {
        // 未到最近触发日 → 未触发
        return false;
      }

    case 'month': // 每月DD日触发
      const targetDayOfMonth = param;
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();

      const lastMonthTrigger = new Date(
        currentYear,
        currentMonth,
        targetDayOfMonth,
      );
      if (lastMonthTrigger <= date) {
        // 当月触发日已过 → 已触发
        return true;
      } else {
        // 当月触发日未到 → 未触发
        return false;
      }

    default:
      return false;
  }
}
