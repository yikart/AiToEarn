/*
 * @Author: nevin
 * @Date: 2025-02-13 21:04:23
 * @LastEditTime: 2025-02-13 21:12:22
 * @LastEditors: nevin
 * @Description: schedule 定时任务
 */
import schedule from 'node-schedule';
export const scheduleJob = schedule;

export const scheduleJobMap = new Map<string, schedule.Job>();

/**
 * 删除任务
 */
export function deleteScheduleJob(key: string) {
  const job = scheduleJobMap.get(key);
  if (job) {
    job.cancel();
    scheduleJobMap.delete(key);
  }
}
